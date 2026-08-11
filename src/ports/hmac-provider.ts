import type { TotpAlgorithm } from "../domain/types.js";

/**
 * Abstraction over HMAC computation.
 *
 * HOTP/TOTP domain logic depends on this port instead of a concrete
 * cryptography API, so the hashing backend can be swapped (Web Crypto,
 * Node's `node:crypto`, a hardware module, a test double) without touching
 * OTP generation logic.
 *
 * The library ships {@link WebCryptoHmacProvider}. Implement this yourself
 * to use a different backend, e.g. Node's `node:crypto`:
 *
 * @example
 * ```ts
 * import { createHmac } from "node:crypto";
 *
 * class NodeCryptoHmacProvider implements HmacProvider {
 *   async sign(algorithm: TotpAlgorithm, secret: Uint8Array, message: Uint8Array) {
 *     const hashName = algorithm.replace("-", "").toLowerCase(); // "sha1" | "sha256" | "sha512"
 *     return new Uint8Array(createHmac(hashName, secret).update(message).digest());
 *   }
 * }
 * ```
 */
export interface HmacProvider {
  /**
   * Computes HMAC(secret, message) using the given hash algorithm.
   *
   * @param algorithm which hash function to use.
   * @param secret raw key bytes.
   * @param message raw data to authenticate (the encoded HOTP counter).
   * @returns the raw HMAC digest bytes.
   */
  sign(
    algorithm: TotpAlgorithm,
    secret: Uint8Array,
    message: Uint8Array
  ): Promise<Uint8Array>;
}
