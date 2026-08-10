import type { TokenComparator } from "../ports/token-comparator.js";

/**
 * Token comparator that avoids short-circuiting on the first differing
 * character, so comparison time does not vary with *where* two
 * equal-length strings first diverge.
 *
 * Note on scope: a length mismatch is still detected (and returned)
 * immediately, which leaks the fact that lengths differ. This is
 * unavoidable without padding to a fixed size and is standard practice for
 * fixed-format OTP comparison, since OTP length is public information
 * (determined by the configured digit count), not a secret.
 */
export class ConstantTimeComparator implements TokenComparator {
  equals(expected: string, actual: string): boolean {
    if (expected.length !== actual.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
    }

    return mismatch === 0;
  }
}
