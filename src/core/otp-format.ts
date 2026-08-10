import type { TotpDigits } from "../domain/types.js";

const DIGIT_MODULI: Record<TotpDigits, number> = {
  6: 1_000_000,
  7: 10_000_000,
  8: 100_000_000,
};

/** Formats a truncated dynamic binary code as a zero-padded decimal OTP. */
export function formatOtp(value: number, digits: TotpDigits): string {
  const modulus = DIGIT_MODULI[digits];
  return (value % modulus).toString().padStart(digits, "0");
}
