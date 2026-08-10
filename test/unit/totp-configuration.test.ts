import { describe, expect, it } from "vitest";
import { TotpConfiguration } from "../../src/domain/configuration.js";
import { InvalidConfigurationError } from "../../src/errors/index.js";

describe("TotpConfiguration", () => {
  it("applies RFC 6238 defaults", () => {
    const config = TotpConfiguration.create();
    expect(config.algorithm).toBe("SHA-1");
    expect(config.digits).toBe(6);
    expect(config.period).toBe(30);
  });

  it("accepts valid overrides", () => {
    const config = TotpConfiguration.create({ algorithm: "SHA-256", digits: 8, period: 60 });
    expect(config.toConfig()).toEqual({ algorithm: "SHA-256", digits: 8, period: 60 });
  });

  it("rejects an unsupported algorithm", () => {
    // @ts-expect-error intentionally invalid at the type level
    expect(() => TotpConfiguration.create({ algorithm: "MD5" })).toThrow(InvalidConfigurationError);
  });

  it("rejects an unsupported digit count", () => {
    // @ts-expect-error intentionally invalid at the type level
    expect(() => TotpConfiguration.create({ digits: 9 })).toThrow(InvalidConfigurationError);
  });

  it("rejects a non-positive period", () => {
    expect(() => TotpConfiguration.create({ period: 0 })).toThrow(InvalidConfigurationError);
    expect(() => TotpConfiguration.create({ period: -5 })).toThrow(InvalidConfigurationError);
    expect(() => TotpConfiguration.create({ period: 1.5 })).toThrow(InvalidConfigurationError);
  });

  it("with() derives a new immutable configuration", () => {
    const base = TotpConfiguration.create({ algorithm: "SHA-1", digits: 6, period: 30 });
    const derived = base.with({ algorithm: "SHA-256" });

    expect(derived.toConfig()).toEqual({ algorithm: "SHA-256", digits: 6, period: 30 });
    expect(base.toConfig()).toEqual({ algorithm: "SHA-1", digits: 6, period: 30 }); // unchanged
  });
});
