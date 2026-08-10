import { describe, expect, it } from "vitest";
import { dynamicTruncate } from "../../src/core/truncation.js";
import { InvalidConfigurationError } from "../../src/errors/index.js";

describe("dynamicTruncate", () => {
  it("selects the offset from the last nibble and extracts a 31-bit value", () => {
    // Last byte 19 (0x13) -> offset = 0x13 & 0x0f = 3 -> read bytes[3..6].
    const hmac = Uint8Array.from({ length: 20 }, (_, i) => i);
    // (3 & 0x7f) << 24 | 4 << 16 | 5 << 8 | 6
    expect(dynamicTruncate(hmac)).toBe(50_595_078);
  });

  it("masks off the sign bit of the first extracted byte", () => {
    const hmac = new Uint8Array(20);
    hmac[19] = 0xff; // offset = 0xff & 0x0f = 15 -> read bytes[15..18]... actually bytes[15..18]? offset+3=18
    hmac[15] = 0x80; // top bit set -> must be cleared by masking with 0x7f
    hmac[16] = 0x01;
    hmac[17] = 0x02;
    hmac[18] = 0xff;
    // (0x80 & 0x7f) << 24 | 0x01 << 16 | 0x02 << 8 | 0xff
    expect(dynamicTruncate(hmac)).toBe((0x00 << 24) | (0x01 << 16) | (0x02 << 8) | 0xff);
    expect(dynamicTruncate(hmac)).toBeLessThan(0x80_00_00_00); // always non-negative / 31-bit
  });

  it("rejects digests shorter than 4 bytes", () => {
    expect(() => dynamicTruncate(new Uint8Array(3))).toThrow(InvalidConfigurationError);
  });

  it("rejects a digest too short for its own offset, instead of reading past the end", () => {
    // length 16, last byte's nibble = 15 -> offset 15 -> needs bytes[15..18], but length is only 16.
    const hmac = new Uint8Array(16);
    hmac[15] = 0xff;
    expect(() => dynamicTruncate(hmac)).toThrow(InvalidConfigurationError);
  });
});
