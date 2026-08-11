import type { OtpAuthUriOptions } from "../domain/types.js";
import { OtpAuthUriBuilder } from "../provisioning/otpauth-uri-builder.js";

/**
 * Builds an `otpauth://totp/...` provisioning URI suitable for rendering
 * as a QR code in an authenticator app.
 *
 * @param options.issuer shown as the account's "issuer" in the authenticator app, e.g. `"Acme"`.
 * @param options.account shown as the account label, e.g. the user's email.
 * @param options.secret Base32-encoded shared secret.
 * @returns an `otpauth://` URI. Feed it to any QR code renderer — this function does not render one itself.
 *
 * @example
 * ```ts
 * const uri = toOtpAuthUri({
 *   issuer: "Acme",
 *   account: "jane@example.com",
 *   secret,
 * });
 * // "otpauth://totp/Acme:jane%40example.com?secret=...&issuer=Acme&algorithm=SHA1&digits=6&period=30"
 * ```
 */
export function toOtpAuthUri(options: OtpAuthUriOptions): string {
  return new OtpAuthUriBuilder().build(options);
}
