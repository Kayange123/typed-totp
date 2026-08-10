# Security

`typed-totp` generates and verifies RFC 6238 TOTP / RFC 4226 HOTP codes. It is
a cryptographic primitive, **not a complete multi-factor authentication
(MFA) system**. Using it correctly and safely is the responsibility of the
integrating application. This document covers what the library does, what
it deliberately does not do, and how to use it safely.

## Reporting a vulnerability

Please report suspected security vulnerabilities privately (e.g. via a
GitHub Security Advisory on this repository) rather than opening a public
issue. Do not include real secrets, tokens, or user data in a report.

## What this library does

- Generates TOTP/HOTP codes per RFC 6238 / RFC 4226, using Web Crypto
  (`crypto.subtle`) for HMAC and `crypto.getRandomValues` for random secret
  generation — never `Math.random()`.
- Compares tokens using a comparator that does not short-circuit on the
  first differing character, so equal-length comparisons take the same
  amount of time regardless of *where* two strings differ. Note this
  covers a single comparison only: with `window > 0`, `verifyDetailed`
  checks candidate steps in order and returns as soon as one matches, so
  overall response time can reveal *which* step matched (i.e. how far off
  the client's clock was). That is not considered sensitive — the window
  size is public, configured by the server — but it is a real, deliberate
  gap in constant-time behavior, not an oversight.
- Encodes/decodes Base32 secrets and builds `otpauth://` provisioning URIs.

## What this library does not do

- **Secret storage.** Secrets are handled in memory only. Persisting them
  (database, disk, session store) is the caller's responsibility.
- **Replay protection.** RFC 6238 codes are valid for an entire time step
  and, with a verification `window`, for adjacent steps too. This library
  does not track "already used" codes. If replay prevention matters for
  your threat model, record the matched counter/step (see
  `verifyTotpDetailed`'s `counter` field) after a successful verification
  and reject any future attempt with a counter ≤ the last accepted one.
- **Rate limiting / brute-force protection.** A 6-digit code has only one
  million possible values. Without rate limiting, an attacker can brute
  force it well within a 30-second window at scale. Enforce a strict limit
  on verification attempts per account (e.g. 5 attempts, then lock out or
  require a delay) at the application layer.
- **Transport security.** Secrets and codes must only ever be transmitted
  over HTTPS/TLS. This library does not enforce or check that.
- **Full MFA UX** (enrollment flows, backup/recovery codes, device
  binding, session step-up, admin reset flows). Build these around the
  primitives this library provides.

## Secure secret handling

- **Storage**: encrypt TOTP secrets at rest (e.g. envelope encryption with
  a KMS-managed key), the same way you would a password hash or API key.
  A stolen database should not directly yield usable TOTP secrets.
- **Logging**: never log secrets, generated codes, or full `otpauth://`
  URIs (they embed the secret). Redact them from error messages, request
  logs, and crash reports.
- **Exposure boundaries**: a Base32 secret and its raw bytes are
  equivalent — treat both as sensitive. `TotpSecret.toBytes()` returns a
  defensive copy on every call specifically so callers cannot accidentally
  hold a long-lived, externally-mutable reference to the raw key material;
  it does not, however, make the bytes any less sensitive once copied out
  — clear or drop references to them as soon as you're done.
- **Provisioning QR codes**: an `otpauth://` URI contains the raw secret.
  Serve it once at enrollment time over an authenticated, encrypted
  channel, and avoid caching or logging it (browser history, CDN caches,
  and access logs are common leak points).

## Clock drift

TOTP verification depends on the server and client agreeing on the current
time. Use the `window` option in `verifyTotp`/`Totp.verify` to tolerate a
small amount of drift (`window: 1` accepts the previous, current, and next
30-second step). Keep the server's clock synchronized (NTP) — drift beyond
your configured window will cause legitimate codes to fail.

## Randomness

`generateSecret()` / `TotpSecret.generate()` use
`WebCryptoRandomSource`, backed by `crypto.getRandomValues`, a CSPRNG
suitable for generating secret key material. Do not substitute a custom
`RandomSource` backed by a non-cryptographic PRNG (e.g. `Math.random()`,
a seeded PRNG, or a linear congruential generator) — doing so would make
generated secrets predictable.

## Algorithm and configuration choices

- SHA-1 remains part of RFC 6238 and is what virtually all authenticator
  apps (Google Authenticator, Authy, etc.) support; its use here is for
  HMAC construction, not as a general-purpose hash, and HMAC-SHA-1 is not
  weakened by the collision attacks that affect SHA-1 in other contexts.
  Prefer SHA-256/SHA-512 when you control both ends (server and a custom
  client) and don't need compatibility with third-party authenticator
  apps.
- 6 digits with a 30-second period is the widest-compatible default.
  Longer codes (8 digits) reduce brute-force risk further but are not
  universally supported by authenticator apps.
