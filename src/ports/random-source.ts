/**
 * Abstraction over cryptographically secure random byte generation.
 *
 * Implementations MUST use a CSPRNG (e.g. Web Crypto's
 * `crypto.getRandomValues`). Never implement this with `Math.random()`.
 */
export interface RandomSource {
  /** Returns `length` cryptographically secure random bytes. */
  getBytes(length: number): Uint8Array;
}
