import type { TotpConfig, TotpVerifyOptions } from "../domain/types.js";
import type { TotpVerificationResult } from "../domain/verification-result.js";
import { Totp } from "../domain/totp.js";

export type VerifyTotpOptions = Partial<TotpConfig> & TotpVerifyOptions;

/**
 * Verifies a TOTP token against a Base32-encoded secret, returning only
 * whether it was valid. Use {@link verifyTotpDetailed} if you need to
 * know which time step matched (e.g. to detect clock drift).
 *
 * @param token the code the user submitted, e.g. `"482913"`.
 * @param secret Base32-encoded shared secret.
 * @param options config overrides, plus `window` for clock-drift tolerance.
 * @returns `true` if `token` is valid for the current (or, with `window`, a nearby) time step.
 *
 * @example
 * ```ts
 * const valid = await verifyTotp(token, secret);
 *
 * // Tolerate one 30s step of client clock drift either side:
 * const validWithDrift = await verifyTotp(token, secret, { window: 1 });
 * ```
 */
export async function verifyTotp(
  token: string,
  secret: string,
  options: VerifyTotpOptions = {}
): Promise<boolean> {
  const result = await verifyTotpDetailed(token, secret, options);
  return result.valid;
}

/**
 * Like {@link verifyTotp}, but reports the matched time-step delta and counter.
 *
 * @param token the code the user submitted.
 * @param secret Base32-encoded shared secret.
 * @param options config overrides, plus `window` for clock-drift tolerance.
 * @returns a discriminated union: `{ valid: true, delta, counter }` on success, `{ valid: false }` otherwise.
 *
 * @example
 * ```ts
 * const result = await verifyTotpDetailed(token, secret, { window: 1 });
 * if (result.valid) {
 *   console.log(`matched step offset ${result.delta}`); // -1, 0, or 1
 * }
 * ```
 */
export async function verifyTotpDetailed(
  token: string,
  secret: string,
  options: VerifyTotpOptions = {}
): Promise<TotpVerificationResult> {
  const { window, timestamp, ...config } = options;
  const totp = new Totp({ secret, ...config });

  const verifyOptions: TotpVerifyOptions = {
    ...(window !== undefined ? { window } : {}),
    ...(timestamp !== undefined ? { timestamp } : {}),
  };

  return totp.verifyDetailed(token, verifyOptions);
}
