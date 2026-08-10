import assert from "node:assert/strict";
import {
  generateSecret,
  generateTotp,
  verifyTotp,
  verifyTotpDetailed,
  toOtpAuthUri,
  Totp,
  TotpSecret,
  FixedClock,
  Hotp,
  Base32Codec,
  TotpConfiguration,
  InvalidConfigurationError,
} from "typed-totp";

// --- Functional API ---
const secret = generateSecret();
assert.match(secret, /^[A-Z2-7]+=*$/);

const token = await generateTotp(secret);
assert.match(token, /^\d{6}$/);
assert.equal(await verifyTotp(token, secret), true);
assert.equal(await verifyTotp("000000", secret), false);

const detailed = await verifyTotpDetailed(token, secret);
assert.equal(detailed.valid, true);
assert.equal(detailed.delta, 0);
assert.equal(typeof detailed.counter, "bigint");

const uri = toOtpAuthUri({ issuer: "Acme", account: "jane@example.com", secret });
assert.match(uri, /^otpauth:\/\/totp\//);

// --- OO / DI API ---
const fixedSecret = TotpSecret.fromBytes(new TextEncoder().encode("12345678901234567890"));
const totp = new Totp(
  { secret: fixedSecret, digits: 8, algorithm: "SHA-1", period: 30 },
  { clock: new FixedClock(59_000) }
);
const rfcToken = await totp.generate();
assert.equal(rfcToken, "94287082"); // RFC 6238 vector, T=59

const hotp = new Hotp();
const hotpCode = await hotp.generate(new TextEncoder().encode("12345678901234567890"), 0n);
assert.equal(hotpCode, "755224"); // RFC 4226 vector, counter=0

const codec = new Base32Codec();
assert.equal(codec.decode(codec.encode(new Uint8Array([1, 2, 3]))).join(","), "1,2,3");

const config = TotpConfiguration.create({ digits: 8 });
assert.equal(config.digits, 8);

try {
  TotpConfiguration.create({ period: -1 });
  assert.fail("expected InvalidConfigurationError");
} catch (err) {
  assert.ok(err instanceof InvalidConfigurationError);
}

console.log("All sample-project smoke assertions passed.");
