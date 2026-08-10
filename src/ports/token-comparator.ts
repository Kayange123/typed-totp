/**
 * Abstraction over OTP token comparison.
 *
 * Isolates comparison semantics (in particular, timing-attack resistance)
 * from verification orchestration.
 */
export interface TokenComparator {
  /** Returns true if `expected` and `actual` represent the same token. */
  equals(expected: string, actual: string): boolean;
}
