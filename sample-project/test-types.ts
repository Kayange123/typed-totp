import {
  generateSecret,
  generateTotp,
  verifyTotp,
  Totp,
  TotpSecret,
  type TotpAlgorithm,
  type TotpVerificationResult,
  type Clock,
} from "typed-totp";

class MyClock implements Clock {
  now(): number {
    return 12345;
  }
}

async function main(): Promise<void> {
  const secret: string = generateSecret({ byteLength: 32 });
  const algorithm: TotpAlgorithm = "SHA-256";
  const token: string = await generateTotp(secret, { algorithm, digits: 8 });
  const valid: boolean = await verifyTotp(token, secret, { algorithm, digits: 8, window: 1 });

  const totp = new Totp({ secret: TotpSecret.fromBase32(secret) }, { clock: new MyClock() });
  const result: TotpVerificationResult = await totp.verifyDetailed(token);

  if (result.valid) {
    // Narrowing must work: `delta`/`counter` only exist when valid is true.
    const delta: number = result.delta;
    const counter: bigint = result.counter;
    console.log(delta, counter);
  }

  console.log(valid);
}

await main();
