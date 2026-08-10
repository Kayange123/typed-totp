/**
 * Discriminated union describing the outcome of a TOTP verification.
 *
 * On success, `delta` reports which time step matched relative to the
 * verification timestamp (e.g. `-1` means the previous step matched,
 * indicating clock drift), and `counter` reports the absolute matched
 * counter value.
 */
export type TotpVerificationResult =
  | {
      readonly valid: true;
      readonly delta: number;
      readonly counter: bigint;
    }
  | {
      readonly valid: false;
    };
