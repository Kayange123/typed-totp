import type { Clock } from "../ports/clock.js";

/** Production {@link Clock} backed by the platform's wall clock. */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/**
 * Deterministic {@link Clock} for tests. Always returns the same
 * timestamp, avoiding the need to mock global `Date`/`Date.now`.
 */
export class FixedClock implements Clock {
  constructor(private readonly timestamp: number) {}

  now(): number {
    return this.timestamp;
  }
}
