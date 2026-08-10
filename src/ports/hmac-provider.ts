import type { TotpAlgorithm } from "../domain/types.js";

/**
 * Abstraction over HMAC computation.
 *
 * HOTP/TOTP domain logic depends on this port instead of a concrete
 * cryptography API, so the hashing backend can be swapped (Web Crypto,
 * Node's `node:crypto`, a hardware module, a test double) without touching
 * OTP generation logic.
 */
export interface HmacProvider {
  /**
   * Computes HMAC(secret, message) using the given hash algorithm.
   *
   * @returns the raw HMAC digest bytes.
   */
  sign(
    algorithm: TotpAlgorithm,
    secret: Uint8Array,
    message: Uint8Array
  ): Promise<Uint8Array>;
}
