/**
 * Abstraction over time retrieval.
 *
 * Core OTP logic depends on this port instead of calling `Date.now()`
 * directly, which makes time-dependent behaviour (TOTP counters, window
 * verification) deterministic and unit-testable.
 *
 * The library ships {@link SystemClock} (production) and {@link FixedClock}
 * (tests) — implement this yourself only for something neither covers,
 * e.g. a clock synced against a trusted time server:
 *
 * @example
 * ```ts
 * class NtpClock implements Clock {
 *   constructor(private offsetMs: number) {}
 *   now(): number {
 *     return Date.now() + this.offsetMs;
 *   }
 * }
 * ```
 */
export interface Clock {
  /** Returns the current time as Unix milliseconds. */
  now(): number;
}
