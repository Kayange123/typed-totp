import type { OtpAuthUriOptions } from "../domain/types.js";
import { OtpAuthUriBuilder } from "../provisioning/otpauth-uri-builder.js";

/**
 * Builds an `otpauth://totp/...` provisioning URI suitable for rendering
 * as a QR code in an authenticator app.
 */
export function toOtpAuthUri(options: OtpAuthUriOptions): string {
  return new OtpAuthUriBuilder().build(options);
}
