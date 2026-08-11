import type {
  OtpGenerator,
  TotpConfig,
  TotpDependencies,
  TotpGenerateOptions,
  TotpVerifyOptions,
} from "./types.js";
import type { TotpVerificationResult } from "./verification-result.js";
import { TotpConfiguration } from "./configuration.js";
import { TotpSecret } from "./totp-secret.js";
import { Hotp } from "./hotp.js";
import { createDefaultTotpDependencies } from "./dependencies.js";
import { calculateCounter } from "../core/counter.js";
import { InvalidConfigurationError } from "../errors/index.js";

/** Constructor options for {@link Totp}: a secret plus optional config overrides. */
export type TotpOptions = Partial<TotpConfig> & {
  readonly secret: string | TotpSecret;
};

/**
 * Object-oriented, dependency-injectable RFC 6238 TOTP service.
 *
 * Conceptually: `generate`/`verify` calculate the current time-step
 * counter, then delegate to {@link Hotp} (HMAC -> dynamic truncation ->
 * decimal formatting) — TOTP is HOTP plus a time-derived counter, not a
 * separate algorithm.
 *
 * All collaborators (clock, HMAC provider, secret codec, token comparator)
 * are injected with secure production defaults, so typical usage needs no
 * knowledge of the underlying ports. Provide `dependencies` only to
 * customize behaviour, most commonly a {@link FixedClock} in tests.
 *
 * @example
 * ```ts
 * const totp = new Totp({ secret, algorithm: "SHA-256", digits: 8, period: 30 });
 * const token = await totp.generate();
 * const valid = await totp.verify(token);
 * ```
 *
 * @example Dependency injection (testing with a fixed clock)
 * ```ts
 * const totp = new Totp({ secret }, { clock: new FixedClock(1_700_000_000_000) });
 * const token = await totp.generate(); // same result every time
 * ```
 */
export class Totp implements OtpGenerator {
  private readonly configuration: TotpConfiguration;
  private readonly secret: TotpSecret;
  private readonly deps: TotpDependencies;
  private readonly hotp: Hotp;

  constructor(options: TotpOptions, dependencies: Partial<TotpDependencies> = {}) {
    const { secret, ...configOverrides } = options;
    this.deps = { ...createDefaultTotpDependencies(), ...dependencies };
    this.configuration = TotpConfiguration.create(configOverrides);
    this.secret = TotpSecret.from(secret, this.deps.codec);
    this.hotp = new Hotp({ hmac: this.deps.hmac });
  }

  /** The effective, fully-resolved configuration (defaults applied). */
  get config(): TotpConfig {
    return this.configuration.toConfig();
  }

  /**
   * @param options.timestamp Unix milliseconds to generate for, instead of the injected clock.
   * @returns the current OTP for this instance's configuration and secret.
   *
   * @example
   * ```ts
   * const token = await totp.generate();
   * ```
   */
  async generate(options: TotpGenerateOptions = {}): Promise<string> {
    const timestamp = options.timestamp ?? this.deps.clock.now();
    const counter = calculateCounter(timestamp, this.configuration.period);
    return this.hotp.generate(this.secret.toBytes(), counter, {
      algorithm: this.configuration.algorithm,
      digits: this.configuration.digits,
    });
  }

  /**
   * Verifies a token, returning only whether it was valid.
   *
   * @param token the code the user submitted.
   * @param options `window` (clock-drift tolerance) and/or an explicit `timestamp`.
   * @returns `true` if `token` matches.
   *
   * @example
   * ```ts
   * const valid = await totp.verify(token, { window: 1 });
   * ```
   */
  async verify(token: string, options: TotpVerifyOptions = {}): Promise<boolean> {
    const result = await this.verifyDetailed(token, options);
    return result.valid;
  }

  /**
   * Verifies a token and reports which time step matched.
   *
   * `options.window` controls how many steps of clock drift are tolerated
   * on either side of the current step (default `0`: exact match only).
   *
   * @param token the code the user submitted.
   * @param options `window` (clock-drift tolerance) and/or an explicit `timestamp`.
   * @returns `{ valid: true, delta, counter }` on success, `{ valid: false }` otherwise.
   *
   * @example
   * ```ts
   * const result = await totp.verifyDetailed(token, { window: 1 });
   * if (result.valid) {
   *   console.log(`clock drift: ${result.delta} step(s)`);
   * }
   * ```
   */
  async verifyDetailed(
    token: string,
    options: TotpVerifyOptions = {}
  ): Promise<TotpVerificationResult> {
    const window = options.window ?? 0;
    if (!Number.isInteger(window) || window < 0) {
      throw new InvalidConfigurationError(
        `window must be a non-negative integer, received: ${window}`
      );
    }

    const timestamp = options.timestamp ?? this.deps.clock.now();
    const baseCounter = calculateCounter(timestamp, this.configuration.period);
    const secretBytes = this.secret.toBytes();

    for (let delta = -window; delta <= window; delta++) {
      const counter = baseCounter + BigInt(delta);
      if (counter < 0n) {
        continue;
      }

      const candidate = await this.hotp.generate(secretBytes, counter, {
        algorithm: this.configuration.algorithm,
        digits: this.configuration.digits,
      });

      if (this.deps.comparator.equals(candidate, token)) {
        // Normalize away -0, which `-window` produces when window is 0.
        return { valid: true, delta: delta === 0 ? 0 : delta, counter };
      }
    }

    return { valid: false };
  }

  /**
   * Returns a new `Totp` with the given configuration fields overridden,
   * sharing the same secret and dependencies. Prefer this over mutating
   * an existing instance.
   *
   * @param overrides configuration fields to change; anything omitted is kept as-is.
   * @returns a new, independent `Totp` instance.
   *
   * @example
   * ```ts
   * const sha1 = new Totp({ secret });
   * const sha256 = sha1.with({ algorithm: "SHA-256", digits: 8 });
   * ```
   */
  with(overrides: Partial<TotpConfig>): Totp {
    const nextConfig = this.configuration.with(overrides).toConfig();
    return new Totp({ secret: this.secret, ...nextConfig }, this.deps);
  }
}
