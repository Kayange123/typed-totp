/**
 * Abstraction over OTP token comparison.
 *
 * Isolates comparison semantics (in particular, timing-attack resistance)
 * from verification orchestration.
 *
 * The library ships {@link ConstantTimeComparator}. Implement this
 * yourself only if you have stricter timing-safety requirements, e.g.
 * padding both inputs to a fixed length before comparing so even a
 * length mismatch isn't observable:
 *
 * @example
 * ```ts
 * class PaddedComparator implements TokenComparator {
 *   equals(expected: string, actual: string): boolean {
 *     const pad = (s: string) => s.padEnd(16, "\0");
 *     const [a, b] = [pad(expected), pad(actual)];
 *     let mismatch = a.length === b.length ? 0 : 1;
 *     for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
 *     return mismatch === 0;
 *   }
 * }
 * ```
 */
export interface TokenComparator {
  /** Returns true if `expected` and `actual` represent the same token. */
  equals(expected: string, actual: string): boolean;
}
