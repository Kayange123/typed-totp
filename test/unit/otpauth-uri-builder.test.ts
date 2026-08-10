import { describe, expect, it } from "vitest";
import { OtpAuthUriBuilder } from "../../src/provisioning/otpauth-uri-builder.js";
import { InvalidConfigurationError } from "../../src/errors/index.js";

describe("OtpAuthUriBuilder", () => {
  const builder = new OtpAuthUriBuilder();

  it("builds a URI with defaults applied", () => {
    const uri = builder.build({
      issuer: "My App",
      account: "john@example.com",
      secret: "JBSWY3DPEHPK3PXP",
    });

    expect(uri).toBe(
      "otpauth://totp/My%20App:john%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My%20App&algorithm=SHA1&digits=6&period=30"
    );
  });

  it("reflects explicit algorithm/digits/period overrides", () => {
    const uri = builder.build({
      issuer: "Acme",
      account: "jane",
      secret: "ABCDEFGH",
      algorithm: "SHA-256",
      digits: 8,
      period: 60,
    });

    expect(uri).toContain("algorithm=SHA256");
    expect(uri).toContain("digits=8");
    expect(uri).toContain("period=60");
  });

  it("percent-encodes special characters in issuer and account", () => {
    const uri = builder.build({
      issuer: "A&B Corp",
      account: "user name",
      secret: "ABCDEFGH",
    });

    expect(uri).toContain("A%26B%20Corp:user%20name");
  });

  it("rejects an empty issuer, account, or secret", () => {
    expect(() => builder.build({ issuer: "", account: "a", secret: "s" })).toThrow(
      InvalidConfigurationError
    );
    expect(() => builder.build({ issuer: "i", account: "", secret: "s" })).toThrow(
      InvalidConfigurationError
    );
    expect(() => builder.build({ issuer: "i", account: "a", secret: "" })).toThrow(
      InvalidConfigurationError
    );
  });
});
