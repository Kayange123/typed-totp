import type { HmacProvider } from "../ports/hmac-provider.js";
import type { TotpAlgorithm } from "../domain/types.js";
import { InvalidConfigurationError, UnsupportedAlgorithmError } from "../errors/index.js";

const SUPPORTED_ALGORITHMS: ReadonlySet<TotpAlgorithm> = new Set([
  "SHA-1",
  "SHA-256",
  "SHA-512",
]);

function resolveSubtleCrypto(): SubtleCrypto {
  const subtle = (globalThis as { crypto?: Crypto }).crypto?.subtle;
  if (!subtle) {
    throw new InvalidConfigurationError(
      "Web Crypto API (globalThis.crypto.subtle) is not available in this environment."
    );
  }
  return subtle;
}

/**
 * Production {@link HmacProvider} backed by the Web Crypto API
 * (`crypto.subtle`), available natively in browsers and in Node.js 20+.
 */
export class WebCryptoHmacProvider implements HmacProvider {
  async sign(
    algorithm: TotpAlgorithm,
    secret: Uint8Array,
    message: Uint8Array
  ): Promise<Uint8Array> {
    if (!SUPPORTED_ALGORITHMS.has(algorithm)) {
      throw new UnsupportedAlgorithmError(
        `Unsupported HMAC algorithm: ${algorithm}. Supported: ${[...SUPPORTED_ALGORITHMS].join(", ")}`
      );
    }

    const subtle = resolveSubtleCrypto();
    const key = await subtle.importKey(
      "raw",
      secret.slice().buffer,
      { name: "HMAC", hash: { name: algorithm } },
      false,
      ["sign"]
    );
    const signature = await subtle.sign("HMAC", key, message.slice().buffer);
    return new Uint8Array(signature);
  }
}
