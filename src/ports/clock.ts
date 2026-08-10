/**
 * Abstraction over time retrieval.
 *
 * Core OTP logic depends on this port instead of calling `Date.now()`
 * directly, which makes time-dependent behaviour (TOTP counters, window
 * verification) deterministic and unit-testable.
 */
export interface Clock {
  /** Returns the current time as Unix milliseconds. */
  now(): number;
}
