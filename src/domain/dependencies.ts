import type { TotpDependencies } from "./types.js";
import { SystemClock } from "../adapters/system-clock.js";
import { WebCryptoHmacProvider } from "../adapters/web-crypto-hmac.js";
import { Base32Codec } from "../adapters/base32-codec.js";
import { ConstantTimeComparator } from "../adapters/constant-time-comparator.js";

/**
 * Builds the default, production-ready {@link TotpDependencies}: real
 * wall-clock time, Web Crypto HMAC, Base32 secret encoding, and a
 * timing-safe token comparator.
 *
 * Normal usage of {@link Totp} never needs to call this directly — it is
 * applied automatically for any dependency not explicitly overridden.
 * Call it yourself only if you want the defaults as a starting point for
 * a partial override object.
 */
export function createDefaultTotpDependencies(): TotpDependencies {
  return {
    clock: new SystemClock(),
    hmac: new WebCryptoHmacProvider(),
    codec: new Base32Codec(),
    comparator: new ConstantTimeComparator(),
  };
}
