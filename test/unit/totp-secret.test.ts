import { describe, expect, it } from "vitest";
import { TotpSecret } from "../../src/domain/totp-secret.js";
import { InvalidSecretError, InvalidConfigurationError } from "../../src/errors/index.js";
import type { RandomSource } from "../../src/ports/random-source.js";

class FixedRandomSource implements RandomSource {
  constructor(private readonly byte: number) {}
  getBytes(length: number): Uint8Array {
    return new Uint8Array(length).fill(this.byte);
  }
}

describe("TotpSecret", () => {
  it("round-trips through Base32", () => {
    const secret = TotpSecret.fromBytes(new Uint8Array([1, 2, 3, 4, 5]));
    const base32 = secret.toBase32();
    expect(TotpSecret.fromBase32(base32).toBytes()).toEqual(secret.toBytes());
  });

  it("rejects an empty byte secret", () => {
    expect(() => TotpSecret.fromBytes(new Uint8Array(0))).toThrow(InvalidSecretError);
  });

  it("rejects an empty Base32 secret", () => {
    expect(() => TotpSecret.fromBase32("")).toThrow(InvalidSecretError);
  });

  it("generates a secret of the default length (20 bytes)", () => {
    const secret = TotpSecret.generate();
    expect(secret.toBytes()).toHaveLength(20);
  });

  it("generates a secret of a custom length using the injected RandomSource", () => {
    const secret = TotpSecret.generate({ byteLength: 32 }, new FixedRandomSource(0xab));
    expect(secret.toBytes()).toHaveLength(32);
    expect(secret.toBytes().every((b) => b === 0xab)).toBe(true);
  });

  it("rejects a non-positive byte length", () => {
    expect(() => TotpSecret.generate({ byteLength: 0 })).toThrow(InvalidConfigurationError);
    expect(() => TotpSecret.generate({ byteLength: -1 })).toThrow(InvalidConfigurationError);
  });

  it("toBytes() returns a defensive copy that cannot mutate internal state", () => {
    const secret = TotpSecret.fromBytes(new Uint8Array([9, 9, 9]));
    const bytes = secret.toBytes();
    bytes[0] = 0;
    expect(secret.toBytes()).toEqual(new Uint8Array([9, 9, 9]));
  });

  it("from() passes through an existing TotpSecret unchanged", () => {
    const secret = TotpSecret.generate();
    expect(TotpSecret.from(secret)).toBe(secret);
  });

  it("from() decodes a Base32 string", () => {
    const secret = TotpSecret.fromBytes(new Uint8Array([1, 2, 3]));
    expect(TotpSecret.from(secret.toBase32()).toBytes()).toEqual(secret.toBytes());
  });
});
