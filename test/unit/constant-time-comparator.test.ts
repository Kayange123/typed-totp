import { describe, expect, it } from "vitest";
import { ConstantTimeComparator } from "../../src/adapters/constant-time-comparator.js";

describe("ConstantTimeComparator", () => {
  const comparator = new ConstantTimeComparator();

  it("returns true for identical strings", () => {
    expect(comparator.equals("123456", "123456")).toBe(true);
  });

  it("returns false for differing strings of the same length", () => {
    expect(comparator.equals("123456", "654321")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(comparator.equals("123456", "1234567")).toBe(false);
    expect(comparator.equals("123456", "")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(comparator.equals("", "")).toBe(true);
  });
});
