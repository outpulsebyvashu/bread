// PIN storage and unguessable tokens.
// A 4 to 6 digit PIN has very few possibilities, so the stored value must be salted (no two people
// share a hash) and slow to compute (a stolen copy cannot be tried against every PIN in a blink).
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT = { N: 16384, r: 8, p: 1 };
const PREFIX = "scrypt$";

export function hashPin(pin: string, salt: string = randomBytes(16).toString("hex")) {
  const hash = scryptSync(pin, salt, 32, SCRYPT).toString("hex");
  return `${PREFIX}${salt}$${hash}`;
}

// Saved data from before salted hashes: plain SHA-256 with a fixed prefix. Still accepted so nobody is
// locked out, and replaced with a salted hash the next time that person signs in.
const legacyHash = (pin: string) => createHash("sha256").update(`breadpos-demo:${pin}`).digest("hex");

export const isLegacyPinHash = (stored: string) => !stored.startsWith(PREFIX);

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyPin(stored: string, pin: string) {
  if (typeof stored !== "string" || typeof pin !== "string" || !stored) return false;
  if (isLegacyPinHash(stored)) return sameText(stored, legacyHash(pin));
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  return sameText(hash, scryptSync(pin, salt, 32, SCRYPT).toString("hex"));
}

// 72 bits of randomness, safe in a web address. Used for the table QR codes, which are the only secret
// a guest needs to place an order, so they must not be derivable from anything public.
export const randomToken = () => randomBytes(9).toString("base64url");
