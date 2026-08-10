import { InvalidConfigurationError } from "../errors/index.js";

/**
 * Computes the RFC 6238 time-step counter for a given moment.
 *
 * @param timestampMs Unix time in milliseconds.
 * @param period Time step, in seconds. Must be a positive integer.
 */
export function calculateCounter(timestampMs: number, period: number): bigint {
  if (!Number.isInteger(period) || period <= 0) {
    throw new InvalidConfigurationError(
      `TOTP period must be a positive integer number of seconds, received: ${period}`
    );
  }
  if (!Number.isFinite(timestampMs) || timestampMs < 0) {
    throw new InvalidConfigurationError(
      `Timestamp must be a non-negative finite number of milliseconds, received: ${timestampMs}`
    );
  }

  const timestampSeconds = Math.floor(timestampMs / 1000);
  return BigInt(Math.floor(timestampSeconds / period));
}

/** Encodes an HOTP counter as an 8-byte big-endian buffer (RFC 4226 §5.2). */
export function encodeCounter(counter: bigint): Uint8Array {
  if (counter < 0n) {
    throw new InvalidConfigurationError(`HOTP counter must not be negative, received: ${counter}`);
  }

  const bytes = new Uint8Array(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}
