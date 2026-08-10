# typed-totp

A TypeScript-first, zero-runtime-dependency TOTP ([RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)) and HOTP ([RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226)) library, built around small, composable, dependency-injected abstractions instead of a flat bag of utility functions.

- **Zero runtime dependencies** — Base32 and HMAC are implemented against platform APIs (Web Crypto), not third-party packages.
- **Modern platform crypto** — `crypto.subtle` for HMAC, `crypto.getRandomValues` for secrets. Never `Math.random()`.
- **Clean architecture** — clock, randomness, HMAC, secret encoding, and token comparison are all ports you can swap or fake in tests.
- **Two APIs** — a simple functional API for everyday use, and an object-oriented, dependency-injectable API for customization.
- **ESM-first**, fully typed, tree-shakeable (`sideEffects: false`; verified with esbuild — importing only `generateSecret` bundles to ~1.9 KB vs. ~7.1 KB for the full API, with unrelated code like the `otpauth://` URI builder fully eliminated).

## Install

```sh
npm install typed-totp
```

Requires Node.js ≥ 20 (for global Web Crypto) or any modern browser. See [Platform support](#platform-support).

## Quick start

```ts
import { generateSecret, generateTotp, verifyTotp } from "typed-totp";

const secret = generateSecret(); // Base32-encoded, cryptographically random
const token = await generateTotp(secret); // "482913"
const valid = await verifyTotp(token, secret); // true
```

Provisioning a QR code for an authenticator app:

```ts
import { toOtpAuthUri } from "typed-totp";

const uri = toOtpAuthUri({
  issuer: "Acme",
  account: "jane@example.com",
  secret,
});
// otpauth://totp/Acme:jane%40example.com?secret=...&issuer=Acme&algorithm=SHA1&digits=6&period=30
// Feed this into any QR code renderer.
```

Tolerating clock drift and inspecting *why* a token matched:

```ts
import { verifyTotp, verifyTotpDetailed } from "typed-totp";

await verifyTotp(token, secret, { window: 1 }); // accepts prev/current/next step

const result = await verifyTotpDetailed(token, secret, { window: 1 });
if (result.valid) {
  console.log(result.delta); // -1, 0, or 1 — how far off the client's clock was
}
```

## When to use the functional API vs. the OO API

Use the **functional API** (`generateSecret`, `generateTotp`, `verifyTotp`, `verifyTotpDetailed`, `toOtpAuthUri`) for the common case: you have a secret, you want a code or a yes/no answer, and you don't need to reuse configuration across many calls. It builds a `Totp` internally with production defaults on every call.

Reach for the **object-oriented API** (`new Totp(...)`) when you need:

- **Reuse** — construct once, call `generate`/`verify` repeatedly without re-validating config each time.
- **Dependency injection** — inject a `Clock`, `HmacProvider`, `SecretCodec`, or `TokenComparator`, most commonly a `FixedClock` in tests, or a custom `HmacProvider` in an environment without Web Crypto.
- **Derived configuration** — `totp.with({ algorithm: "SHA-256" })` to get a variant without re-specifying the secret.

```ts
import { Totp } from "typed-totp";

const totp = new Totp({
  secret, // Base32 string or a TotpSecret
  algorithm: "SHA-256",
  digits: 8,
  period: 30,
});

const token = await totp.generate();
const valid = await totp.verify(token);
```

### Dependency injection example

```ts
import { Totp, FixedClock, type HmacProvider, type TotpAlgorithm } from "typed-totp";

// A deterministic clock for tests — no need to mock Date.now().
const clock = new FixedClock(1_700_000_000_000);

// A custom HMAC backend (e.g. wrapping Node's node:crypto instead of Web Crypto).
class NodeCryptoHmacProvider implements HmacProvider {
  async sign(algorithm: TotpAlgorithm, secret: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
    const { createHmac } = await import("node:crypto");
    const hashName = algorithm.replace("-", "").toLowerCase(); // "sha1" | "sha256" | "sha512"
    return new Uint8Array(createHmac(hashName, secret).update(message).digest());
  }
}

const totp = new Totp(
  { secret, algorithm: "SHA-1", digits: 6, period: 30 },
  { clock, hmac: new NodeCryptoHmacProvider() }
);

const token = await totp.generate();
```

You only need to provide the dependencies you're overriding — anything omitted falls back to the secure default (`SystemClock`, `WebCryptoHmacProvider`, `Base32Codec`, `ConstantTimeComparator`; see `createDefaultTotpDependencies()`).

## Architecture

```text
Public API            generateTotp() / verifyTotp() / generateSecret() / toOtpAuthUri()
    |
Application Services  Totp (orchestration), OtpAuthUriBuilder
    |
Domain                TotpConfiguration, TotpSecret, Hotp, TotpVerificationResult
    |
Functional Core        calculateCounter, encodeCounter, dynamicTruncate, formatOtp   (pure, no I/O)
    |
Ports (interfaces)     Clock, RandomSource, HmacProvider, SecretCodec, TokenComparator
    |
Platform Adapters      SystemClock/FixedClock, WebCryptoRandomSource, WebCryptoHmacProvider,
                        Base32Codec, ConstantTimeComparator
```

**TOTP is HOTP with a time-derived counter — not a separate algorithm.** `Totp.generate()`:

1. Computes the current time-step counter (`calculateCounter(timestamp, period)`).
2. Delegates to `Hotp.generate(secretBytes, counter, { algorithm, digits })`.
3. `Hotp` does: encode the counter as 8 big-endian bytes → HMAC via the injected `HmacProvider` → `dynamicTruncate` (RFC 4226 §5.3) → `formatOtp`.

This delegation is real, not aspirational: `Totp` holds an internal `Hotp` instance and every code it produces goes through it, so `Hotp` can be — and is — tested independently against the raw RFC 4226 vectors, while `Totp` is tested against RFC 6238's time-based vectors.

### Why these specific abstractions

Every port isolates a responsibility that either (a) touches the outside world (time, randomness, cryptography) and would otherwise make core logic untestable without mocking globals, or (b) is a place a real consumer has asked to swap in practice:

| Port | Isolates | Production default | Why it's a port and not a function call |
|---|---|---|---|
| `Clock` | `Date.now()` | `SystemClock` | Lets tests use `FixedClock` for deterministic time-step math instead of mocking global `Date`. |
| `RandomSource` | `crypto.getRandomValues` | `WebCryptoRandomSource` | Keeps secret generation testable and makes it structurally impossible to accidentally wire in `Math.random()`. |
| `HmacProvider` | HMAC computation | `WebCryptoHmacProvider` | Lets the hashing backend be swapped (Node's `node:crypto`, a hardware module, a spy in tests) without touching HOTP/TOTP logic. |
| `SecretCodec` | Secret text encoding | `Base32Codec` | Base32 is the convention today; a future encoding wouldn't require touching TOTP/HOTP at all. |
| `TokenComparator` | Token comparison | `ConstantTimeComparator` | Verification's security property (not short-circuiting on the first differing byte) is a distinct concern from verification's control flow. |

Deliberately **not** abstracted: dynamic truncation, counter encoding, and OTP formatting are pure math with no external dependency, so they're plain functions (`core/`), not classes or ports. Wrapping them in an interface would be ceremony with no extension point behind it.

### Immutability

`TotpConfiguration` and `TotpSecret` are immutable value objects — validated once at construction, no setters. Reconfiguring uses `with()` to derive a new instance (`totp.with({ algorithm: "SHA-256" })`) rather than mutating in place. `TotpSecret.toBytes()` always returns a defensive copy, so callers can't reach into a `Totp`/`TotpSecret` instance and corrupt its internal key material.

### Construction style

Two deliberately different patterns, chosen per type:

- **Static factories** (`TotpConfiguration.create()`, `TotpSecret.fromBase32()` / `.generate()`) where there are multiple valid ways to construct the object (decode vs. generate) and/or validation that should run once, centrally.
- **Plain constructors** (`new Totp(...)`, `new Hotp(...)`) where there is exactly one construction shape (config + secret, optional dependency overrides) — a factory would just be indirection.

### Extending the library

The ports in `src/ports/` are the intended extension points:

- Implement `HmacProvider` to use a different crypto backend (HSM, `node:crypto`, WASM).
- Implement `RandomSource` to source entropy from somewhere other than Web Crypto (e.g. a hardware RNG in an embedded runtime).
- Implement `SecretCodec` to support a secret representation other than Base32.
- Implement `Clock` to control time in tests or simulations.
- Implement `TokenComparator` if you have stricter timing-safety requirements than the bundled implementation.

Pass any combination of these into `new Totp(config, { ...overrides })`; anything you don't override keeps its secure default.

## Public API reference

### Functional

```ts
generateSecret(options?: { byteLength?: number }): string
generateTotp(secret: string, options?: Partial<TotpConfig> & { timestamp?: number }): Promise<string>
verifyTotp(token: string, secret: string, options?: Partial<TotpConfig> & { window?: number; timestamp?: number }): Promise<boolean>
verifyTotpDetailed(token: string, secret: string, options?: ...): Promise<TotpVerificationResult>
toOtpAuthUri(options: { issuer: string; account: string; secret: string; algorithm?; digits?; period? }): string
```

### Object-oriented

```ts
new Totp(options: { secret: string | TotpSecret } & Partial<TotpConfig>, dependencies?: Partial<TotpDependencies>)
totp.generate(options?: { timestamp?: number }): Promise<string>
totp.verify(token: string, options?: TotpVerifyOptions): Promise<boolean>
totp.verifyDetailed(token: string, options?: TotpVerifyOptions): Promise<TotpVerificationResult>
totp.with(overrides: Partial<TotpConfig>): Totp

new Hotp(dependencies?: { hmac?: HmacProvider })
hotp.generate(secret: Uint8Array, counter: bigint, options?: HotpOptions): Promise<string>

TotpSecret.fromBase32(value: string): TotpSecret
TotpSecret.fromBytes(bytes: Uint8Array): TotpSecret
TotpSecret.generate(options?: { byteLength?: number }): TotpSecret
secret.toBase32(): string
secret.toBytes(): Uint8Array // defensive copy

TotpConfiguration.create(config?: Partial<TotpConfig>): TotpConfiguration
config.with(overrides: Partial<TotpConfig>): TotpConfiguration

new OtpAuthUriBuilder().build(options: OtpAuthUriOptions): string
```

`TotpVerificationResult` is a discriminated union:

```ts
type TotpVerificationResult =
  | { valid: true; delta: number; counter: bigint }
  | { valid: false };
```

### Errors

```ts
TotpError                     // base class
├── InvalidSecretError        // malformed/empty secret
├── InvalidConfigurationError // bad algorithm/digits/period/window/byteLength
└── UnsupportedAlgorithmError // HMAC algorithm not in SHA-1/SHA-256/SHA-512
```

`verify`/`verifyTotp` never throw on a malformed or wrong token — they return `false` (or `{ valid: false }`), so callers can treat "invalid input" and "wrong code" identically without a try/catch on the hot path. The error hierarchy above is for misuse of the API itself (bad configuration), not for user-supplied guesses.

## RFC compliance

- **RFC 4226 (HOTP)**: counter encoded as an 8-byte big-endian value (§5.2), HMAC computed over it, dynamic truncation per §5.3 (top-bit-masked 31-bit extraction at an offset from the digest's last nibble), decimal formatting via modulo + zero-padding. Verified against all 10 official test vectors (`test/rfc/rfc4226.test.ts`).
- **RFC 6238 (TOTP)**: time-step counter `floor((T - T0) / X)` with `T0 = 0`, HOTP delegation for the rest. Verified against all 18 official test vectors (6 timestamps × SHA-1/SHA-256/SHA-512, 8-digit output, `test/rfc/rfc6238.test.ts`).
- Supports SHA-1, SHA-256, SHA-512; 6/7/8-digit codes; configurable period; explicit timestamp override; Base32 secrets with lenient decoding (upper/lowercase, missing padding, grouping whitespace/hyphens).

## Platform support

- **Node.js**: 20+ (global `crypto.subtle` / `crypto.getRandomValues`, no `--experimental-*` flag needed).
- **Browsers**: any browser with Web Crypto (all evergreen browsers). Web Crypto requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or `localhost`).
- Published as ESM only (`"type": "module"`, `exports` map with `types`/`import` conditions). No CommonJS build.

## Security

See [SECURITY.md](./SECURITY.md) for secret storage, replay handling, rate-limiting, clock drift, and randomness guidance. In short: **this library generates and verifies OTP codes — it is not a complete MFA system.** Rate limiting, replay tracking, secret encryption at rest, and enrollment/recovery flows are the integrating application's responsibility.

## Project layout

```text
src/
├── index.ts               Public barrel export
├── api/                    Thin functional wrappers over the OO API
├── domain/                 Totp, Hotp, TotpSecret, TotpConfiguration, types, verification result
├── core/                   Pure functions: counter math, dynamic truncation, OTP formatting
├── ports/                  Interfaces: Clock, RandomSource, HmacProvider, SecretCodec, TokenComparator
├── adapters/                Production + test implementations of each port
├── provisioning/            OtpAuthUriBuilder
└── errors/                  Typed error hierarchy
test/
├── unit/                    Per-component unit tests (one file per class/function)
└── rfc/                     RFC 4226 / RFC 6238 official test vectors
```

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit, strict mode
npm run lint        # eslint . (typescript-eslint strict + eslint-plugin-sonarjs)
npm test            # vitest run
npm run build       # tsup -> dist/ (ESM + .d.ts + source maps)
```

### Linting

`npm run lint` runs ESLint configured with `typescript-eslint`'s `strictTypeChecked`/`stylisticTypeChecked` rule sets plus [`eslint-plugin-sonarjs`](https://github.com/SonarSource/eslint-plugin-sonarjs), which implements SonarQube's JS/TS rules (many of the `typescript:Sxxxx` IDs a SonarQube/SonarLint scan would report) as ESLint rules — so the same class of issues a full SonarQube analysis flags (redundant type assertions, unsafe `undefined` interpolation, super-linear regexes, unnecessary conversions, etc.) is caught locally, in CI-less form, via `eslint.config.js`. The few rules turned off there are documented inline with why (e.g. `no-non-null-assertion` conflicts with `non-nullable-type-assertion-style`'s own recommendation; `expect.any()` is typed `any` by vitest's own design).

### Git hooks

This repo uses [Husky](https://typicode.github.io/husky/) to keep contributions consistent: `npm install` runs `prepare` automatically, which wires up a `pre-commit` hook (`.husky/pre-commit`) that runs `npm run typecheck && npm run lint && npm test` before every commit. A commit that fails typecheck, lint, or breaks a test — including the RFC 4226/6238 vector tests — is rejected locally, before it ever reaches CI or a reviewer.

## License

MIT — see [LICENSE](./LICENSE).
