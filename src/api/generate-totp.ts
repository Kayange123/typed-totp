import type { TotpConfig, TotpGenerateOptions } from "../domain/types.js";
import { Totp } from "../domain/totp.js";

export type GenerateTotpOptions = Partial<TotpConfig> & TotpGenerateOptions;

/**
 * Generates a TOTP token for a Base32-encoded secret.
 *
 * Convenience wrapper around {@link Totp} for callers who don't need
 * dependency injection or a reusable instance. Defaults: SHA-1, 6 digits,
 * 30-second period (RFC 6238's defaults).
 *
 * @param secret Base32-encoded shared secret (see {@link generateSecret}).
 * @param options config overrides (`algorithm`/`digits`/`period`) and/or an explicit `timestamp`.
 * @returns the current OTP, e.g. `"482913"`.
 *
 * @example
 * ```ts
 * const token = await generateTotp(secret);
 *
 * // Non-default config:
 * const token8 = await generateTotp(secret, { algorithm: "SHA-256", digits: 8 });
 *
 * // Deterministic, for tests:
 * const tokenAt = await generateTotp(secret, { timestamp: 1_700_000_000_000 });
 * ```
 */
export async function generateTotp(secret: string, options: GenerateTotpOptions = {}): Promise<string> {
  const { timestamp, ...config } = options;
  const totp = new Totp({ secret, ...config });
  return totp.generate(timestamp !== undefined ? { timestamp } : {});
}
