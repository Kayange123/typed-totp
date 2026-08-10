import type { TotpAlgorithm, TotpConfig, TotpDigits } from "./types.js";
import { InvalidConfigurationError } from "../errors/index.js";

const SUPPORTED_ALGORITHMS: ReadonlySet<TotpAlgorithm> = new Set([
  "SHA-1",
  "SHA-256",
  "SHA-512",
]);
const SUPPORTED_DIGITS: ReadonlySet<TotpDigits> = new Set([6, 7, 8]);

export const DEFAULT_TOTP_CONFIG: TotpConfig = {
  algorithm: "SHA-1",
  digits: 6,
  period: 30,
};

/**
 * Immutable, validated TOTP configuration.
 *
 * Validation happens once, at construction, rather than being repeated
 * throughout the codebase every time an algorithm/digits/period value is
 * used. Use {@link TotpConfiguration.with} to derive a new configuration
 * instead of mutating an existing one.
 */
export class TotpConfiguration implements TotpConfig {
  private constructor(
    public readonly algorithm: TotpAlgorithm,
    public readonly digits: TotpDigits,
    public readonly period: number
  ) {}

  /** Creates a validated configuration, filling in unset fields with defaults. */
  static create(config: Partial<TotpConfig> = {}): TotpConfiguration {
    const algorithm = config.algorithm ?? DEFAULT_TOTP_CONFIG.algorithm;
    const digits = config.digits ?? DEFAULT_TOTP_CONFIG.digits;
    const period = config.period ?? DEFAULT_TOTP_CONFIG.period;

    if (!SUPPORTED_ALGORITHMS.has(algorithm)) {
      throw new InvalidConfigurationError(
        `Unsupported algorithm: ${algorithm}. Supported: ${[...SUPPORTED_ALGORITHMS].join(", ")}`
      );
    }
    if (!SUPPORTED_DIGITS.has(digits)) {
      throw new InvalidConfigurationError(
        `Unsupported digit count: ${String(digits)}. Supported: ${[...SUPPORTED_DIGITS].join(", ")}`
      );
    }
    if (!Number.isInteger(period) || period <= 0) {
      throw new InvalidConfigurationError(
        `Period must be a positive integer number of seconds, received: ${period}`
      );
    }

    return new TotpConfiguration(algorithm, digits, period);
  }

  /** Returns a new configuration with the given fields overridden. */
  with(overrides: Partial<TotpConfig>): TotpConfiguration {
    return TotpConfiguration.create({ ...this.toConfig(), ...overrides });
  }

  toConfig(): TotpConfig {
    return { algorithm: this.algorithm, digits: this.digits, period: this.period };
  }
}
