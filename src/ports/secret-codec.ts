/**
 * Abstraction over textual encoding of raw secret bytes.
 *
 * Isolates the encoding scheme (Base32 by default, per RFC 4648 /
 * Google Authenticator convention) from TOTP/HOTP logic, so alternative
 * representations can be introduced later without touching OTP generation.
 */
export interface SecretCodec {
  /** Encodes raw bytes into this codec's textual representation. */
  encode(bytes: Uint8Array): string;

  /** Decodes a textual representation back into raw bytes. */
  decode(value: string): Uint8Array;
}
