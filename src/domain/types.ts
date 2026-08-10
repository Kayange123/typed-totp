import type { Clock } from "../ports/clock.js";
import type { HmacProvider } from "../ports/hmac-provider.js";
import type { SecretCodec } from "../ports/secret-codec.js";
import type { TokenComparator } from "../ports/token-comparator.js";

/** HMAC hash algorithms supported for HOTP/TOTP generation. */
export type TotpAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

/** Number of digits in a generated OTP. */
export type TotpDigits = 6 | 7 | 8;

/** RFC 6238 configuration shared by every TOTP generated from it. */
export interface TotpConfig {
  readonly algorithm: TotpAlgorithm;
  readonly digits: TotpDigits;
  /** Time step, in seconds. Must be a positive integer. */
  readonly period: number;
}

/** Options accepted when verifying a TOTP token. */
export interface TotpVerifyOptions {
  /**
   * Number of time steps of clock drift to tolerate on either side of the
   * current step. `window: 1` checks the previous, current, and next step.
   * Defaults to `0`.
   */
  readonly window?: number;
  /** Unix milliseconds to verify against, instead of the injected clock. */
  readonly timestamp?: number;
}

/** Options accepted when generating a TOTP token. */
export interface TotpGenerateOptions {
  /** Unix milliseconds to generate for, instead of the injected clock. */
  readonly timestamp?: number;
}

/** Options accepted by {@link OtpGenerator.generate}. */
export interface GenerateOptions {
  readonly timestamp?: number;
}

/** Common contract for anything that produces an OTP string on demand. */
export interface OtpGenerator {
  generate(options?: GenerateOptions): Promise<string>;
}

/** Per-call overrides accepted by the low-level {@link Hotp} generator. */
export interface HotpOptions {
  readonly algorithm?: TotpAlgorithm;
  readonly digits?: TotpDigits;
}

/** Options accepted when generating a new random secret. */
export interface SecretGenerationOptions {
  /**
   * Number of random bytes to generate. Defaults to 20 (160 bits), the
   * value recommended by RFC 4226 for HMAC-SHA-1. Consider a larger value
   * (32+) when using SHA-256/SHA-512.
   */
  readonly byteLength?: number;
}

/** Options accepted by {@link OtpAuthUriBuilder.build}. */
export interface OtpAuthUriOptions {
  readonly issuer: string;
  readonly account: string;
  /** Base32-encoded secret. */
  readonly secret: string;
  readonly algorithm?: TotpAlgorithm;
  readonly digits?: TotpDigits;
  readonly period?: number;
}

/**
 * Full set of injectable dependencies used by {@link Totp}.
 *
 * Every dependency has a secure default (see `createDefaultTotpDependencies`)
 * so consumers only need to provide this when they want to override
 * specific behaviour (e.g. inject a {@link FixedClock} in tests).
 */
export interface TotpDependencies {
  readonly clock: Clock;
  readonly hmac: HmacProvider;
  readonly codec: SecretCodec;
  readonly comparator: TokenComparator;
}
