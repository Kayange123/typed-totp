/**
 * Abstraction over textual encoding of raw secret bytes.
 *
 * Isolates the encoding scheme (Base32 by default, per RFC 4648 /
 * Google Authenticator convention) from TOTP/HOTP logic, so alternative
 * representations can be introduced later without touching OTP generation.
 *
 * The library ships {@link Base32Codec}. Implement this yourself only to
 * support a different textual encoding:
 *
 * @example
 * ```ts
 * class HexCodec implements SecretCodec {
 *   encode(bytes: Uint8Array): string {
 *     return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
 *   }
 *   decode(value: string): Uint8Array {
 *     return new Uint8Array(value.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
 *   }
 * }
 * ```
 */
export interface SecretCodec {
  /** Encodes raw bytes into this codec's textual representation. */
  encode(bytes: Uint8Array): string;

  /** Decodes a textual representation back into raw bytes. */
  decode(value: string): Uint8Array;
}
