import type { HotpOptions, TotpAlgorithm, TotpDigits } from "./types.js";
import type { HmacProvider } from "../ports/hmac-provider.js";
import { WebCryptoHmacProvider } from "../adapters/web-crypto-hmac.js";
import { encodeCounter } from "../core/counter.js";
import { dynamicTruncate } from "../core/truncation.js";
import { formatOtp } from "../core/otp-format.js";

const DEFAULT_ALGORITHM: TotpAlgorithm = "SHA-1";
const DEFAULT_DIGITS: TotpDigits = 6;

/**
 * RFC 4226 HOTP generator.
 *
 * This is the primitive that {@link Totp} delegates to for the actual
 * OTP computation: a time-based counter is derived from the current time
 * step, then HOTP does counter encoding -> HMAC -> dynamic truncation ->
 * decimal formatting. Kept independently testable against the official
 * RFC 4226 vectors.
 */
export class Hotp {
  private readonly hmac: HmacProvider;

  constructor(dependencies: { hmac?: HmacProvider } = {}) {
    this.hmac = dependencies.hmac ?? new WebCryptoHmacProvider();
  }

  /**
   * Generates an HOTP code for the given secret and counter.
   *
   * @param secret raw secret bytes (not Base32-encoded).
   * @param counter the moving factor (RFC 4226 §5).
   */
  async generate(secret: Uint8Array, counter: bigint, options: HotpOptions = {}): Promise<string> {
    const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
    const digits = options.digits ?? DEFAULT_DIGITS;

    const counterBytes = encodeCounter(counter);
    const digest = await this.hmac.sign(algorithm, secret, counterBytes);
    const truncated = dynamicTruncate(digest);

    return formatOtp(truncated, digits);
  }
}
