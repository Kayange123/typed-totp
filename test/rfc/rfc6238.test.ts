import { describe, expect, it } from "vitest";
import { Totp } from "../../src/domain/totp.js";
import { TotpSecret } from "../../src/domain/totp-secret.js";
import { FixedClock } from "../../src/adapters/system-clock.js";
import type { TotpAlgorithm } from "../../src/domain/types.js";

// RFC 6238 Appendix B test vectors. Secrets are raw ASCII bytes (NOT
// Base32), 20/32/64 bytes for SHA-1/SHA-256/SHA-512 respectively.
const SECRETS: Record<TotpAlgorithm, Uint8Array> = {
  "SHA-1": new TextEncoder().encode("12345678901234567890"),
  "SHA-256": new TextEncoder().encode("12345678901234567890123456789012"),
  "SHA-512": new TextEncoder().encode(
    "1234567890123456789012345678901234567890123456789012345678901234"
  ),
};

const VECTORS: readonly {
  timeSeconds: number;
  "SHA-1": string;
  "SHA-256": string;
  "SHA-512": string;
}[] = [
  { timeSeconds: 59, "SHA-1": "94287082", "SHA-256": "46119246", "SHA-512": "90693936" },
  { timeSeconds: 1_111_111_109, "SHA-1": "07081804", "SHA-256": "68084774", "SHA-512": "25091201" },
  { timeSeconds: 1_111_111_111, "SHA-1": "14050471", "SHA-256": "67062674", "SHA-512": "99943326" },
  { timeSeconds: 1_234_567_890, "SHA-1": "89005924", "SHA-256": "91819424", "SHA-512": "93441116" },
  { timeSeconds: 2_000_000_000, "SHA-1": "69279037", "SHA-256": "90698825", "SHA-512": "38618901" },
  { timeSeconds: 20_000_000_000, "SHA-1": "65353130", "SHA-256": "77737706", "SHA-512": "47863826" },
];

describe("RFC 6238 TOTP test vectors", () => {
  const algorithms: TotpAlgorithm[] = ["SHA-1", "SHA-256", "SHA-512"];

  for (const algorithm of algorithms) {
    describe(algorithm, () => {
      it.each(VECTORS.map((v) => [v.timeSeconds, v[algorithm]] as const))(
        "T=%i produces %s",
        async (timeSeconds, expected) => {
          const secret = TotpSecret.fromBytes(SECRETS[algorithm]);
          const totp = new Totp(
            { secret, algorithm, digits: 8, period: 30 },
            { clock: new FixedClock(timeSeconds * 1000) }
          );

          expect(await totp.generate()).toBe(expected);
        }
      );
    });
  }
});
