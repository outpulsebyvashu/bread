import { requestOrigin } from "../hosts";
import { SESSION_HOURS } from "./token";

// Secure cookies are dropped by browsers on plain http addresses (a phone on the shop Wi-Fi),
// so the flag follows how the request really arrived.
export function cookieOptions(request: Request, maxAgeSeconds = SESSION_HOURS * 60 * 60) {
  const https = requestOrigin(request).startsWith("https://");
  return { httpOnly: true, sameSite: "lax" as const, secure: https, path: "/", maxAge: maxAgeSeconds };
}
