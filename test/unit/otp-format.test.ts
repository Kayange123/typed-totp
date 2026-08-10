import { describe, expect, it } from "vitest";
import { formatOtp } from "../../src/core/otp-format.js";

describe("formatOtp", () => {
  it("zero-pads short values", () => {
    expect(formatOtp(1234, 6)).toBe("001234");
    expect(formatOtp(5, 8)).toBe("00000005");
    expect(formatOtp(0, 6)).toBe("000000");
  });

  it("truncates values exceeding the digit count via modulo", () => {
    expect(formatOtp(123_456_789, 6)).toBe("456789");
  });

  it("supports 6, 7, and 8 digit formats", () => {
    expect(formatOtp(42, 6)).toHaveLength(6);
    expect(formatOtp(42, 7)).toHaveLength(7);
    expect(formatOtp(42, 8)).toHaveLength(8);
  });
});
