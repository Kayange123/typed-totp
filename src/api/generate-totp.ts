import type { TotpConfig, TotpGenerateOptions } from "../domain/types.js";
import { Totp } from "../domain/totp.js";

export type GenerateTotpOptions = Partial<TotpConfig> & TotpGenerateOptions;

/**
 * Generates a TOTP token for a Base32-encoded secret.
 *
 * Convenience wrapper around {@link Totp} for callers who don't need
 * dependency injection or a reusable instance. Defaults: SHA-1, 6 digits,
 * 30-second period (RFC 6238's defaults).
 */
export async function generateTotp(secret: string, options: GenerateTotpOptions = {}): Promise<string> {
  const { timestamp, ...config } = options;
  const totp = new Totp({ secret, ...config });
  return totp.generate(timestamp !== undefined ? { timestamp } : {});
}
