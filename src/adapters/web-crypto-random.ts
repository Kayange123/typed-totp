import type { RandomSource } from "../ports/random-source.js";
import { InvalidConfigurationError } from "../errors/index.js";

function resolveCrypto(): Crypto {
  const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (!globalCrypto?.getRandomValues) {
    throw new InvalidConfigurationError(
      "Web Crypto API (globalThis.crypto.getRandomValues) is not available in this environment."
    );
  }
  return globalCrypto;
}

/**
 * Production {@link RandomSource} backed by the Web Crypto API
 * (`crypto.getRandomValues`), available natively in browsers and in
 * Node.js 20+. Never uses `Math.random()`.
 */
export class WebCryptoRandomSource implements RandomSource {
  getBytes(length: number): Uint8Array {
    if (!Number.isInteger(length) || length <= 0) {
      throw new InvalidConfigurationError(
        `Random byte length must be a positive integer, received: ${length}`
      );
    }
    return resolveCrypto().getRandomValues(new Uint8Array(length));
  }
}
