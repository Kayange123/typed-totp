import { describe, expect, it } from "vitest";
import { calculateCounter, encodeCounter } from "../../src/core/counter.js";
import { InvalidConfigurationError } from "../../src/errors/index.js";

describe("calculateCounter", () => {
  it("computes RFC 6238 time steps", () => {
    expect(calculateCounter(59_000, 30)).toBe(1n);
    expect(calculateCounter(1_111_111_109_000, 30)).toBe(37037036n);
    expect(calculateCounter(1_111_111_111_000, 30)).toBe(37037037n);
    expect(calculateCounter(1_234_567_890_000, 30)).toBe(41152263n);
    expect(calculateCounter(2_000_000_000_000, 30)).toBe(66666666n);
    expect(calculateCounter(20_000_000_000_000, 30)).toBe(666666666n);
  });

  it("respects a custom period", () => {
    expect(calculateCounter(60_000, 60)).toBe(1n);
    expect(calculateCounter(59_999, 60)).toBe(0n);
  });

  it("rejects a non-positive period", () => {
    expect(() => calculateCounter(0, 0)).toThrow(InvalidConfigurationError);
    expect(() => calculateCounter(0, -30)).toThrow(InvalidConfigurationError);
  });

  it("rejects a negative timestamp", () => {
    expect(() => calculateCounter(-1, 30)).toThrow(InvalidConfigurationError);
  });
});

describe("encodeCounter", () => {
  it("encodes zero as 8 zero bytes", () => {
    expect(encodeCounter(0n)).toEqual(new Uint8Array(8));
  });

  it("encodes as big-endian", () => {
    expect(encodeCounter(1n)).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]));
    expect(encodeCounter(256n)).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0]));
  });

  it("rejects a negative counter", () => {
    expect(() => encodeCounter(-1n)).toThrow(InvalidConfigurationError);
  });
});
