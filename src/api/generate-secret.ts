import type { SecretGenerationOptions } from "../domain/types.js";
import { TotpSecret } from "../domain/totp-secret.js";

/**
 * Generates a new cryptographically random TOTP secret, Base32-encoded
 * and ready to hand to `generateTotp`/`verifyTotp` or to embed in an
 * `otpauth://` URI.
 */
export function generateSecret(options?: SecretGenerationOptions): string {
  return TotpSecret.generate(options).toBase32();
}
