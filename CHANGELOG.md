# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@example` JSDoc blocks on the functional API, `Totp`/`Hotp`/`TotpSecret`/`TotpConfiguration`/`OtpAuthUriBuilder`, and all five ports (each port's example shows a minimal custom implementation), so editor hover tooltips and AI coding assistants have runnable snippets instead of prose alone.
- `llms.txt` — a condensed, link-structured overview of the package for LLM-based tools that fetch it directly.
- This changelog.

## [0.1.0] - 2026-08-10

Initial release.

### Added

- RFC 6238 TOTP and RFC 4226 HOTP generation and verification, implemented and verified against the official test vectors for both (SHA-1/SHA-256/SHA-512, 6/7/8 digits).
- Functional API: `generateSecret`, `generateTotp`, `verifyTotp`, `verifyTotpDetailed`, `toOtpAuthUri`.
- Object-oriented, dependency-injectable API: `Totp`, `Hotp`, `TotpSecret`, `TotpConfiguration`, `OtpAuthUriBuilder`.
- Injectable ports with secure Web Crypto-backed defaults: `Clock` (`SystemClock`/`FixedClock`), `RandomSource` (`WebCryptoRandomSource`), `HmacProvider` (`WebCryptoHmacProvider`), `SecretCodec` (`Base32Codec`), `TokenComparator` (`ConstantTimeComparator`).
- Typed error hierarchy: `TotpError`, `InvalidSecretError`, `InvalidConfigurationError`, `UnsupportedAlgorithmError`.
- Zero runtime dependencies, ESM-only package with generated `.d.ts` and source maps.
- Husky pre-commit hook (typecheck + lint + test) and ESLint (`typescript-eslint` strict + `eslint-plugin-sonarjs`) for local static analysis.
- README, SECURITY.md, and a sample project verifying the built package from an external consumer.

[Unreleased]: https://github.com/Kayange123/typed-totp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Kayange123/typed-totp/releases/tag/v0.1.0
