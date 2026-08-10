// ---------------------------------------------------------------------------
// Simple, functional API — the entry point for most consumers.
// ---------------------------------------------------------------------------
export { generateSecret } from "./api/generate-secret.js";
export { generateTotp, type GenerateTotpOptions } from "./api/generate-totp.js";
export { verifyTotp, verifyTotpDetailed, type VerifyTotpOptions } from "./api/verify-totp.js";
export { toOtpAuthUri } from "./api/to-otpauth-uri.js";

// ---------------------------------------------------------------------------
// Object-oriented API — for dependency injection, reuse, and customization.
// ---------------------------------------------------------------------------
export { Totp, type TotpOptions } from "./domain/totp.js";
export { Hotp } from "./domain/hotp.js";
export { TotpSecret } from "./domain/totp-secret.js";
export { TotpConfiguration, DEFAULT_TOTP_CONFIG } from "./domain/configuration.js";
export { createDefaultTotpDependencies } from "./domain/dependencies.js";
export { OtpAuthUriBuilder } from "./provisioning/otpauth-uri-builder.js";

// ---------------------------------------------------------------------------
// Domain types.
// ---------------------------------------------------------------------------
export type {
  TotpAlgorithm,
  TotpDigits,
  TotpConfig,
  TotpVerifyOptions,
  TotpGenerateOptions,
  GenerateOptions,
  OtpGenerator,
  HotpOptions,
  SecretGenerationOptions,
  OtpAuthUriOptions,
  TotpDependencies,
} from "./domain/types.js";
export type { TotpVerificationResult } from "./domain/verification-result.js";

// ---------------------------------------------------------------------------
// Ports — implement these to plug in a custom clock, RNG, HMAC backend,
// secret encoding, or comparison strategy.
// ---------------------------------------------------------------------------
export type { Clock } from "./ports/clock.js";
export type { RandomSource } from "./ports/random-source.js";
export type { HmacProvider } from "./ports/hmac-provider.js";
export type { SecretCodec } from "./ports/secret-codec.js";
export type { TokenComparator } from "./ports/token-comparator.js";

// ---------------------------------------------------------------------------
// Platform adapters — production defaults, plus test doubles.
// ---------------------------------------------------------------------------
export { SystemClock, FixedClock } from "./adapters/system-clock.js";
export { WebCryptoRandomSource } from "./adapters/web-crypto-random.js";
export { WebCryptoHmacProvider } from "./adapters/web-crypto-hmac.js";
export { Base32Codec } from "./adapters/base32-codec.js";
export { ConstantTimeComparator } from "./adapters/constant-time-comparator.js";

// ---------------------------------------------------------------------------
// Pure functional core — exported for advanced use and independent testing.
// ---------------------------------------------------------------------------
export { calculateCounter, encodeCounter } from "./core/counter.js";
export { dynamicTruncate } from "./core/truncation.js";
export { formatOtp } from "./core/otp-format.js";

// ---------------------------------------------------------------------------
// Errors.
// ---------------------------------------------------------------------------
export {
  TotpError,
  InvalidSecretError,
  InvalidConfigurationError,
  UnsupportedAlgorithmError,
} from "./errors/index.js";
