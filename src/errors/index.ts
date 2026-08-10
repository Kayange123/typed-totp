/**
 * Base class for all errors raised by typed-totp.
 *
 * Catch this to handle any library-originated failure generically, or
 * catch one of the specific subclasses below to react to a particular
 * failure mode.
 */
export class TotpError extends Error {
  public override readonly name: string = "TotpError";
}

/**
 * Raised when a secret is malformed: invalid Base32 characters, wrong
 * length, or empty input.
 */
export class InvalidSecretError extends TotpError {
  public override readonly name = "InvalidSecretError";
}

/**
 * Raised when a TOTP/HOTP configuration is invalid: an unsupported digit
 * count, a non-positive period, or a negative counter.
 */
export class InvalidConfigurationError extends TotpError {
  public override readonly name = "InvalidConfigurationError";
}

/**
 * Raised when a requested HMAC algorithm is not one of the algorithms
 * supported by this library (SHA-1, SHA-256, SHA-512).
 */
export class UnsupportedAlgorithmError extends TotpError {
  public override readonly name = "UnsupportedAlgorithmError";
}
