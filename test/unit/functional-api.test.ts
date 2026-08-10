import { describe, expect, it } from "vitest";
import { generateSecret, generateTotp, verifyTotp, verifyTotpDetailed, toOtpAuthUri } from "../../src/index.js";

describe("functional API", () => {
  it("generateSecret produces a valid, decodable Base32 string", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  });

  it("generateSecret respects byteLength", () => {
    const secret = generateSecret({ byteLength: 32 });
    // Base32 encodes 5 bytes as 8 chars; 32 bytes -> ceil(32/5)*8 = 56 chars w/ padding.
    expect(secret.replace(/={1,6}$/, "").length).toBeGreaterThan(generateSecret({ byteLength: 10 }).length);
  });

  it("generateTotp + verifyTotp round-trip", async () => {
    const secret = generateSecret();
    const token = await generateTotp(secret);
    expect(await verifyTotp(token, secret)).toBe(true);
  });

  it("verifyTotp rejects a wrong token", async () => {
    const secret = generateSecret();
    expect(await verifyTotp("000000", secret)).toBe(false);
  });

  it("generateTotp supports an explicit timestamp for determinism", async () => {
    const secret = generateSecret();
    const a = await generateTotp(secret, { timestamp: 1_700_000_000_000 });
    const b = await generateTotp(secret, { timestamp: 1_700_000_000_000 });
    expect(a).toBe(b);
  });

  it("verifyTotpDetailed reports delta 0 for an exact match", async () => {
    const secret = generateSecret();
    const token = await generateTotp(secret, { timestamp: 1_700_000_000_000 });
    const result = await verifyTotpDetailed(token, secret, { timestamp: 1_700_000_000_000 });
    expect(result).toEqual({ valid: true, delta: 0, counter: expect.any(BigInt) });
  });

  it("supports custom algorithm/digits/period end-to-end", async () => {
    const secret = generateSecret();
    const options = { algorithm: "SHA-512" as const, digits: 8 as const, period: 60 };
    const token = await generateTotp(secret, options);
    expect(token).toHaveLength(8);
    expect(await verifyTotp(token, secret, options)).toBe(true);
  });

  it("toOtpAuthUri builds a well-formed otpauth URI", () => {
    const uri = toOtpAuthUri({ issuer: "Acme", account: "jane@example.com", secret: "JBSWY3DPEHPK3PXP" });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});
