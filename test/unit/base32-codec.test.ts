import { describe, expect, it } from "vitest";
import { Base32Codec } from "../../src/adapters/base32-codec.js";
import { InvalidSecretError } from "../../src/errors/index.js";

describe("Base32Codec", () => {
  const codec = new Base32Codec();

  it("encodes empty input to an empty string", () => {
    expect(codec.encode(new Uint8Array(0))).toBe("");
  });

  it("decodes empty input to an empty byte array", () => {
    expect(codec.decode("")).toEqual(new Uint8Array(0));
  });

  it("round-trips arbitrary bytes", () => {
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 128, 64, 32, 16, 8, 4, 2, 1]);
    expect(codec.decode(codec.encode(original))).toEqual(original);
  });

  it("matches known RFC 4648 test vectors", () => {
    const encoder = new TextEncoder();
    expect(codec.encode(encoder.encode("f"))).toBe("MY======");
    expect(codec.encode(encoder.encode("fo"))).toBe("MZXQ====");
    expect(codec.encode(encoder.encode("foo"))).toBe("MZXW6===");
    expect(codec.encode(encoder.encode("foob"))).toBe("MZXW6YQ=");
    expect(codec.encode(encoder.encode("fooba"))).toBe("MZXW6YTB");
    expect(codec.encode(encoder.encode("foobar"))).toBe("MZXW6YTBOI======");
  });

  it("decodes lowercase input", () => {
    expect(codec.decode("mzxw6ytb")).toEqual(new TextEncoder().encode("fooba"));
  });

  it("decodes input missing padding", () => {
    expect(codec.decode("MZXW6YQ")).toEqual(new TextEncoder().encode("foob"));
  });

  it("decodes input with grouping whitespace and hyphens", () => {
    expect(codec.decode("MZXW 6YTB")).toEqual(new TextEncoder().encode("fooba"));
    expect(codec.decode("MZXW-6YTB")).toEqual(new TextEncoder().encode("fooba"));
  });

  it("rejects malformed characters", () => {
    expect(() => codec.decode("!!!!!!!!")).toThrow(InvalidSecretError);
    expect(() => codec.decode("MZXW61TB")).toThrow(InvalidSecretError); // '1' not in alphabet
  });

  it("rejects invalid lengths", () => {
    expect(() => codec.decode("A")).toThrow(InvalidSecretError); // remainder 1
    expect(() => codec.decode("AAA")).toThrow(InvalidSecretError); // remainder 3
    expect(() => codec.decode("AAAAAA")).toThrow(InvalidSecretError); // remainder 6
  });
});
