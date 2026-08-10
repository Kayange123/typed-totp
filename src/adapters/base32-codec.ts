import type { SecretCodec } from "../ports/secret-codec.js";
import { InvalidSecretError } from "../errors/index.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CHARSET_PATTERN = /^[A-Z2-7]*$/;
// Character counts that cannot correspond to a whole number of decoded bytes.
const INVALID_REMAINDERS = new Set([1, 3, 6]);

/**
 * RFC 4648 Base32 codec (no dependency on Node's `Buffer`, works in any
 * JS runtime). Encoding always produces uppercase, padded output.
 *
 * Decoding is lenient: it accepts uppercase or lowercase input, tolerates
 * missing padding, and ignores surrounding whitespace/hyphens (as commonly
 * seen when secrets are displayed in grouped form, e.g. "JBSW-Y3DP-EHPK").
 */
export class Base32Codec implements SecretCodec {
  encode(bytes: Uint8Array): string {
    if (bytes.length === 0) {
      return "";
    }

    let buffer = 0;
    let bufferBits = 0;
    let output = "";

    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bufferBits += 8;
      while (bufferBits >= 5) {
        // `& 0x1f` guarantees an index in 0-31, always within ALPHABET's
        // 32 characters, so this can never actually be undefined.
        output += ALPHABET[(buffer >>> (bufferBits - 5)) & 0x1f]!;
        bufferBits -= 5;
      }
    }

    if (bufferBits > 0) {
      output += ALPHABET[(buffer << (5 - bufferBits)) & 0x1f]!;
    }

    while (output.length % 8 !== 0) {
      output += "=";
    }

    return output;
  }

  decode(value: string): Uint8Array {
    const normalized = value
      .toUpperCase()
      .replace(/[\s-]/g, "")
      .replace(/={1,6}$/, ""); // Base32 padding is at most 6 '=' characters.

    if (normalized.length === 0) {
      return new Uint8Array(0);
    }

    if (!CHARSET_PATTERN.test(normalized)) {
      throw new InvalidSecretError(
        `Invalid Base32 secret: contains characters outside A-Z, 2-7 (received: "${value}")`
      );
    }

    if (INVALID_REMAINDERS.has(normalized.length % 8)) {
      throw new InvalidSecretError(
        `Invalid Base32 secret: length ${normalized.length} does not correspond to a whole number of bytes`
      );
    }

    let buffer = 0;
    let bufferBits = 0;
    const bytes: number[] = [];

    for (const char of normalized) {
      buffer = (buffer << 5) | ALPHABET.indexOf(char);
      bufferBits += 5;
      if (bufferBits >= 8) {
        bytes.push((buffer >>> (bufferBits - 8)) & 0xff);
        bufferBits -= 8;
      }
    }

    return new Uint8Array(bytes);
  }
}
