import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { handoffUrl } from "@/lib/auth/handoff";
import { attemptLogin, PosError } from "@/lib/pos/engine";
import { errorResponse, noStore } from "@/lib/pos/http";
import { mutateState } from "@/lib/pos/store";
import { landingApp, parseApp, ROLES } from "@/lib/roles";
import { cookieOptions } from "@/lib/session/cookies";
import { SESSION_HOURS, signSso, SSO_COOKIE } from "@/lib/session/token";

// The one login. It checks phone and PIN, remembers the sign-in on this domain, and sends the person
// to the app their role belongs in (the one they asked for, if their role allows it).
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown; pin?: unknown; app?: unknown; next?: unknown };
    const requested = parseApp(String(body.app ?? ""));
    const now = Date.now();
    const staff = mutateState((state) => attemptLogin(state, String(body.phone), String(body.pin), requested ?? "auth", ROLES, now));
    const app = landingApp(staff.role, requested);
    const sso = await signSso({ staffId: staff.id, role: staff.role, app: "auth", exp: now + SESSION_HOURS * 60 * 60 * 1000 });
    (await cookies()).set(SSO_COOKIE, sso, cookieOptions(request));
    return noStore({ redirect: await handoffUrl(staff, app, requested === app ? body.next : null, now), app });
  } catch (error) {
    if (error instanceof PosError && error.code === "login_failed") {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 401 });
    }
    return errorResponse(error);
  }
}
