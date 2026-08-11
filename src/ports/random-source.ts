/**
 * Abstraction over cryptographically secure random byte generation.
 *
 * Implementations MUST use a CSPRNG (e.g. Web Crypto's
 * `crypto.getRandomValues`). Never implement this with `Math.random()`.
 *
 * The library ships {@link WebCryptoRandomSource}. Implement this yourself
 * only to source entropy elsewhere, e.g. Node's `node:crypto`:
 *
 * @example
 * ```ts
 * import { randomBytes } from "node:crypto";
 *
 * class NodeCryptoRandomSource implements RandomSource {
 *   getBytes(length: number): Uint8Array {
 *     return new Uint8Array(randomBytes(length));
 *   }
 * }
 * ```
 */
export interface RandomSource {
  /** Returns `length` cryptographically secure random bytes. */
  getBytes(length: number): Uint8Array;
}
