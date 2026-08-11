import type { OtpAuthUriOptions, TotpAlgorithm } from "../domain/types.js";
import { InvalidConfigurationError } from "../errors/index.js";

const DEFAULT_ALGORITHM: TotpAlgorithm = "SHA-1";
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30;

/** Strips hyphens for the `algorithm` query param (Google Authenticator uses "SHA1", not "SHA-1"). */
function toUriAlgorithm(algorithm: TotpAlgorithm): string {
  return algorithm.replace("-", "");
}

/**
 * Builds `otpauth://totp/...` provisioning URIs, as consumed by
 * authenticator apps (Google Authenticator, Authy, 1Password, ...) when
 * rendered as a QR code.
 *
 * Kept as its own abstraction since URI construction is a distinct
 * responsibility from OTP generation: it only formats data that has
 * already been decided upon (secret, issuer, account, algorithm, digits,
 * period) and never touches cryptography.
 *
 * @example
 * ```ts
 * const uri = new OtpAuthUriBuilder().build({
 *   issuer: "Acme",
 *   account: "jane@example.com",
 *   secret: "JBSWY3DPEHPK3PXP",
 * });
 * ```
 */
export class OtpAuthUriBuilder {
  /**
   * @param options.issuer shown as the account's "issuer" in the authenticator app.
   * @param options.account shown as the account label, e.g. the user's email.
   * @param options.secret Base32-encoded shared secret.
   * @throws {InvalidConfigurationError} if `issuer`, `account`, or `secret` is empty.
   * @returns an `otpauth://` URI.
   */
  build(options: OtpAuthUriOptions): string {
    const { issuer, account, secret } = options;
    const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
    const digits = options.digits ?? DEFAULT_DIGITS;
    const period = options.period ?? DEFAULT_PERIOD;

    if (!issuer) {
      throw new InvalidConfigurationError("issuer must be a non-empty string");
    }
    if (!account) {
      throw new InvalidConfigurationError("account must be a non-empty string");
    }
    if (!secret) {
      throw new InvalidConfigurationError("secret must be a non-empty string");
    }

    const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;

    // Built manually (rather than via URLSearchParams) so spaces are
    // percent-encoded as %20, matching the convention used by every major
    // authenticator app, instead of URLSearchParams' form-encoded "+".
    // Typed as fixed-length tuples (rather than left as `string[][]`) so
    // destructuring `value` below is a plain `string`, not `string | undefined`.
    const params: [string, string][] = [
      ["secret", secret],
      ["issuer", issuer],
      ["algorithm", toUriAlgorithm(algorithm)],
      ["digits", String(digits)],
      ["period", String(period)],
    ];

    const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

    return `otpauth://totp/${label}?${query}`;
  }
}
