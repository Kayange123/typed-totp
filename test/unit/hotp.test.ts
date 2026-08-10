import { describe, expect, it } from "vitest";
import { Hotp } from "../../src/domain/hotp.js";
import type { HmacProvider } from "../../src/ports/hmac-provider.js";
import type { TotpAlgorithm } from "../../src/domain/types.js";

/** Records every call it receives and returns a deterministic, fake digest. */
class RecordingHmacProvider implements HmacProvider {
  public calls: { algorithm: TotpAlgorithm; secret: Uint8Array; message: Uint8Array }[] = [];

  sign(algorithm: TotpAlgorithm, secret: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    this.calls.push({ algorithm, secret, message });
    // Deterministic 20-byte "digest" derived from the counter bytes so we
    // can assert generate() end-to-end without depending on real crypto.
    const digest = new Uint8Array(20);
    digest.set(message, 0);
    digest[19] = 0x00; // offset = 0 -> read bytes[0..3], which are the counter bytes.
    return Promise.resolve(digest);
  }
}

describe("Hotp", () => {
  it("delegates to the injected HmacProvider with the encoded counter as the message", async () => {
    const hmac = new RecordingHmacProvider();
    const hotp = new Hotp({ hmac });
    const secret = new Uint8Array([1, 2, 3]);

    await hotp.generate(secret, 5n);

    expect(hmac.calls).toHaveLength(1);
    expect(hmac.calls[0]?.secret).toBe(secret);
    expect(hmac.calls[0]?.message).toEqual(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 5]));
    expect(hmac.calls[0]?.algorithm).toBe("SHA-1"); // default
  });

  it("passes through the requested algorithm and digit count", async () => {
    const hmac = new RecordingHmacProvider();
    const hotp = new Hotp({ hmac });

    await hotp.generate(new Uint8Array([1]), 0n, { algorithm: "SHA-256", digits: 8 });

    expect(hmac.calls[0]?.algorithm).toBe("SHA-256");
  });

  it("produces a code of the requested digit length", async () => {
    const hmac = new RecordingHmacProvider();
    const hotp = new Hotp({ hmac });

    const code6 = await hotp.generate(new Uint8Array([1]), 1n, { digits: 6 });
    const code8 = await hotp.generate(new Uint8Array([1]), 1n, { digits: 8 });

    expect(code6).toHaveLength(6);
    expect(code8).toHaveLength(8);
  });

  it("uses a real HMAC provider by default when none is injected", async () => {
    const hotp = new Hotp();
    const code = await hotp.generate(new Uint8Array([1, 2, 3, 4, 5]), 0n);
    expect(code).toMatch(/^\d{6}$/);
  });
});
