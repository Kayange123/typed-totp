import type { SecretGenerationOptions } from "../domain/types.js";
import { TotpSecret } from "../domain/totp-secret.js";

/**
 * Generates a new cryptographically random TOTP secret, Base32-encoded
 * and ready to hand to `generateTotp`/`verifyTotp` or to embed in an
 * `otpauth://` URI.
 *
 * @param options.byteLength number of random bytes to generate (default 20 / 160 bits).
 * @returns a Base32-encoded secret, e.g. `"JBSWY3DPEHPK3PXP"`.
 *
 * @example
 * ```ts
 * const secret = generateSecret();
 * // "JBSWY3DPEHPK3PXP..." — store this against the user's account.
 *
 * const longerSecret = generateSecret({ byteLength: 32 }); // for SHA-256/512
 * ```
 */
export function generateSecret(options?: SecretGenerationOptions): string {
  return TotpSecret.generate(options).toBase32();
}
