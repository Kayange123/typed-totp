import { describe, expect, it } from "vitest";
import { Totp } from "../../src/domain/totp.js";
import { TotpSecret } from "../../src/domain/totp-secret.js";
import { FixedClock } from "../../src/adapters/system-clock.js";
import { InvalidConfigurationError } from "../../src/errors/index.js";

const secret = TotpSecret.fromBytes(new Uint8Array(20).fill(1));

describe("Totp", () => {
  it("generates a 6-digit SHA-1 code by default", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(0) });
    const code = await totp.generate();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("is deterministic for a fixed clock and produces the same code twice", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(1_700_000_000_000) });
    expect(await totp.generate()).toBe(await totp.generate());
  });

  it("produces different codes across time steps", async () => {
    const totpNow = new Totp({ secret }, { clock: new FixedClock(0) });
    const totpLater = new Totp({ secret }, { clock: new FixedClock(60_000) });
    expect(await totpNow.generate()).not.toBe(await totpLater.generate());
  });

  it("respects an explicit timestamp override, ignoring the injected clock", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(0) });
    const viaClock = await totp.generate({ timestamp: 30_000 });
    const viaExplicitOverride = await new Totp({ secret }, { clock: new FixedClock(30_000) }).generate();
    expect(viaClock).toBe(viaExplicitOverride);
  });

  it("verifies a freshly generated token with no window", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(1_700_000_000_000) });
    const token = await totp.generate();
    expect(await totp.verify(token)).toBe(true);
  });

  it("rejects an incorrect token", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(1_700_000_000_000) });
    expect(await totp.verify("000000")).toBe(false);
  });

  it("rejects a token from an adjacent step when window is 0", async () => {
    const period = 30;
    const t0 = new Totp({ secret, period }, { clock: new FixedClock(0) });
    const t1 = new Totp({ secret, period }, { clock: new FixedClock(period * 1000) });

    const tokenAtStep1 = await t1.generate();
    expect(await t0.verify(tokenAtStep1)).toBe(false);
  });

  it("accepts a token from the previous step when window is 1, reporting delta -1", async () => {
    const period = 30;
    const t0 = new Totp({ secret, period }, { clock: new FixedClock(0) });
    const t1 = new Totp({ secret, period }, { clock: new FixedClock(period * 1000) });

    const tokenAtStep0 = await t0.generate();
    const result = await t1.verifyDetailed(tokenAtStep0, { window: 1 });

    expect(result).toEqual({ valid: true, delta: -1, counter: 0n });
  });

  it("accepts a token from the next step when window is 1, reporting delta +1", async () => {
    const period = 30;
    const t0 = new Totp({ secret, period }, { clock: new FixedClock(0) });
    const t1 = new Totp({ secret, period }, { clock: new FixedClock(period * 1000) });

    const tokenAtStep1 = await t1.generate();
    const result = await t0.verifyDetailed(tokenAtStep1, { window: 1 });

    expect(result).toEqual({ valid: true, delta: 1, counter: 1n });
  });

  it("still rejects tokens two steps away even with window 1", async () => {
    const period = 30;
    const t0 = new Totp({ secret, period }, { clock: new FixedClock(0) });
    const t2 = new Totp({ secret, period }, { clock: new FixedClock(period * 2000) });

    const tokenAtStep2 = await t2.generate();
    const result = await t0.verifyDetailed(tokenAtStep2, { window: 1 });

    expect(result).toEqual({ valid: false });
  });

  it("rejects a negative window", async () => {
    const totp = new Totp({ secret }, { clock: new FixedClock(0) });
    await expect(totp.verifyDetailed("123456", { window: -1 })).rejects.toThrow(
      InvalidConfigurationError
    );
  });

  it("with() derives a new instance without mutating the original", async () => {
    const sha1 = new Totp({ secret, algorithm: "SHA-1" }, { clock: new FixedClock(0) });
    const sha256 = sha1.with({ algorithm: "SHA-256" });

    expect(sha1.config.algorithm).toBe("SHA-1");
    expect(sha256.config.algorithm).toBe("SHA-256");
    expect(await sha1.generate()).not.toBe(await sha256.generate());
  });

  it("with() carries injected dependencies over to the derived instance", async () => {
    const clock = new FixedClock(1_700_000_000_000);
    const original = new Totp({ secret, algorithm: "SHA-1" }, { clock });
    const derived = original.with({ algorithm: "SHA-256" });

    // If `derived` didn't inherit the injected FixedClock, it would fall
    // back to SystemClock and generate() would use the real wall-clock
    // time instead of the fixed timestamp, breaking this comparison.
    const expected = await new Totp({ secret, algorithm: "SHA-256" }, { clock }).generate();
    expect(await derived.generate()).toBe(expected);
  });

  it("accepts a Base32 string secret directly", async () => {
    const base32 = secret.toBase32();
    const fromString = new Totp({ secret: base32 }, { clock: new FixedClock(0) });
    const fromObject = new Totp({ secret }, { clock: new FixedClock(0) });
    expect(await fromString.generate()).toBe(await fromObject.generate());
  });
});
