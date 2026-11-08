// Signed tokens, usable from both the proxy and route handlers. Three kinds, never interchangeable:
//   session  a person's login to one app, kept in that app's own cookie
//   handoff  a one-time, 60 second pass from the login domain to an app domain
//   sso      the login domain's own memory that someone just signed in
// Stand-in for Supabase Auth: the login step swaps at the Supabase stage.
import type { AppId, Role } from "../roles/index.ts";

export type Purpose = "session" | "handoff" | "sso";
export type Claims = { p: Purpose; staffId: string; role: Role; app: AppId | "auth"; exp: number; nonce?: string };
export type Session = Claims;

export const SESSION_HOURS = 12;
export const HANDOFF_SECONDS = 60;
export const cookieName = (app: AppId) => `breadpos_${app}`;
export const SSO_COOKIE = "breadpos_auth";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
  return "breadpos-local-development-only";
}

const encoder = new TextEncoder();

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

async function key() {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(claims: Claims) {
  const body = base64url(encoder.encode(JSON.stringify(claims)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(body)));
  return `${body}.${base64url(signature)}`;
}

async function verify(token: string | undefined, purpose: Purpose, now: number): Promise<Claims | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const expected = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(body)));
    if (base64url(expected) !== signature) return null;
    const claims = JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/"))) as Claims;
    if (claims.p !== purpose || claims.exp < now) return null;
    return claims;
  } catch {
    return null;
  }
}

type Input = Omit<Claims, "p">;

export const signSession = (claims: Input) => sign({ ...claims, p: "session" });
export const signHandoff = (claims: Input) => sign({ ...claims, p: "handoff" });
export const signSso = (claims: Input) => sign({ ...claims, p: "sso" });

export async function verifySession(token: string | undefined, app: AppId, now = Date.now()) {
  const claims = await verify(token, "session", now);
  return claims && claims.app === app ? claims : null;
}
export const verifyHandoff = (token: string | undefined, now = Date.now()) => verify(token, "handoff", now);
export const verifySso = (token: string | undefined, now = Date.now()) => verify(token, "sso", now);
