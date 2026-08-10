import type { TotpConfig, TotpVerifyOptions } from "../domain/types.js";
import type { TotpVerificationResult } from "../domain/verification-result.js";
import { Totp } from "../domain/totp.js";

export type VerifyTotpOptions = Partial<TotpConfig> & TotpVerifyOptions;

/**
 * Verifies a TOTP token against a Base32-encoded secret, returning only
 * whether it was valid. Use {@link verifyTotpDetailed} if you need to
 * know which time step matched (e.g. to detect clock drift).
 */
export async function verifyTotp(
  token: string,
  secret: string,
  options: VerifyTotpOptions = {}
): Promise<boolean> {
  const result = await verifyTotpDetailed(token, secret, options);
  return result.valid;
}

/** Like {@link verifyTotp}, but reports the matched time-step delta and counter. */
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
