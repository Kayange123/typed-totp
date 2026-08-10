import { InvalidConfigurationError } from "../errors/index.js";

/**
 * RFC 4226 §5.3 dynamic truncation: extracts a 31-bit integer from an
 * HMAC digest at an offset determined by the digest's own last nibble.
 */
export function dynamicTruncate(hmac: Uint8Array): number {
  if (hmac.length < 4) {
    throw new InvalidConfigurationError(
      `HMAC digest too short to truncate: expected at least 4 bytes, received ${hmac.length}`
    );
  }

  const lastByte = hmac.at(-1)!;
  const offset = lastByte & 0x0f;

  // The offset nibble ranges 0-15, so the 4 bytes read from it can reach up
  // to index 18 — safe for every algorithm this library supports (SHA-1/
  // 256/512 digests are all >= 20 bytes), but not guaranteed for an
  // arbitrary caller-supplied digest, so it's checked explicitly rather
  // than assumed.
  if (hmac.length < offset + 4) {
    throw new InvalidConfigurationError(
      `HMAC digest too short for its own truncation offset: offset ${offset} requires at least ${offset + 4} bytes, received ${hmac.length}`
    );
  }

  const b0 = hmac[offset]!;
  const b1 = hmac[offset + 1]!;
  const b2 = hmac[offset + 2]!;
  const b3 = hmac[offset + 3]!;

  const binaryCode = ((b0 & 0x7f) << 24) | ((b1 & 0xff) << 16) | ((b2 & 0xff) << 8) | (b3 & 0xff);

  return binaryCode >>> 0;
}
