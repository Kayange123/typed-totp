import { describe, expect, it } from "vitest";
import { Hotp } from "../../src/domain/hotp.js";

// RFC 4226 Appendix D test vectors.
// Secret: ASCII "12345678901234567890" used as raw key bytes (NOT Base32).
const SECRET = new TextEncoder().encode("12345678901234567890");

const EXPECTED: readonly string[] = [
  "755224",
  "287082",
  "359152",
  "969429",
  "338314",
  "254676",
  "287922",
  "162583",
  "399871",
  "520489",
];

describe("RFC 4226 HOTP test vectors", () => {
  const hotp = new Hotp();

  it.each(EXPECTED.map((expected, counter) => [counter, expected] as const))(
    "counter=%i produces %s",
    async (counter, expected) => {
      const code = await hotp.generate(SECRET, BigInt(counter), { digits: 6, algorithm: "SHA-1" });
      expect(code).toBe(expected);
    }
  );
});
