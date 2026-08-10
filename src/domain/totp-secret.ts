import type { SecretGenerationOptions } from "./types.js";
import type { SecretCodec } from "../ports/secret-codec.js";
import type { RandomSource } from "../ports/random-source.js";
import { Base32Codec } from "../adapters/base32-codec.js";
import { WebCryptoRandomSource } from "../adapters/web-crypto-random.js";
import { InvalidConfigurationError, InvalidSecretError } from "../errors/index.js";

const DEFAULT_BYTE_LENGTH = 20; // 160 bits, RFC 4226's recommendation for HMAC-SHA-1.

/**
 * Immutable value object representing a shared TOTP/HOTP secret.
 *
 * Validation happens once at construction (via {@link fromBase32} or
 * {@link generate}) instead of being repeated wherever a secret is used.
 * The raw bytes are never exposed directly; {@link toBytes} always returns
 * a defensive copy so callers cannot mutate internal state.
 */
export class TotpSecret {
  private constructor(private readonly bytes: Uint8Array) {}

  /** Wraps raw secret bytes. Throws if `bytes` is empty. */
  static fromBytes(bytes: Uint8Array): TotpSecret {
    if (bytes.length === 0) {
      throw new InvalidSecretError("Secret bytes must not be empty");
    }
    return new TotpSecret(Uint8Array.from(bytes));
  }

  /** Decodes a Base32-encoded secret (as produced by authenticator apps). */
  static fromBase32(value: string, codec: SecretCodec = new Base32Codec()): TotpSecret {
    const bytes = codec.decode(value);
    if (bytes.length === 0) {
      throw new InvalidSecretError("Decoded secret must not be empty");
    }
    return new TotpSecret(bytes);
  }

  /** Generates a new cryptographically random secret. */
  static generate(
    options: SecretGenerationOptions = {},
    random: RandomSource = new WebCryptoRandomSource()
  ): TotpSecret {
    const byteLength = options.byteLength ?? DEFAULT_BYTE_LENGTH;
    if (!Number.isInteger(byteLength) || byteLength <= 0) {
      throw new InvalidConfigurationError(
        `Secret byte length must be a positive integer, received: ${byteLength}`
      );
    }
    return new TotpSecret(random.getBytes(byteLength));
  }

  /** Accepts either an existing secret or a Base32 string and normalizes to a {@link TotpSecret}. */
  static from(value: string | TotpSecret, codec?: SecretCodec): TotpSecret {
    return value instanceof TotpSecret ? value : TotpSecret.fromBase32(value, codec);
  }

  toBase32(codec: SecretCodec = new Base32Codec()): string {
    return codec.encode(this.bytes);
  }

  /** Returns a defensive copy of the raw secret bytes. */
  toBytes(): Uint8Array {
    return this.bytes.slice();
  }
}
