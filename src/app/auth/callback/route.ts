import { NextResponse, type NextRequest } from "next/server";
import { actorForStaff } from "@/lib/pos/engine";
import { readState } from "@/lib/pos/store";
import { hostServes, loginUrl, requestOrigin, safeNext, SITE_OF, sitesOnHost } from "@/lib/hosts";
import { APP_INFO, parseApp } from "@/lib/roles";
import { cookieOptions } from "@/lib/session/cookies";
import { consumeHandoff } from "@/lib/session/handoff";
import { cookieName, signSession, SESSION_HOURS, verifyHandoff } from "@/lib/session/token";

// Where the login domain sends people. The pass works once and for 60 seconds, then this domain
// gives the person its own session for that one app.
export async function GET(request: NextRequest) {
  const now = Date.now();
  const claims = await verifyHandoff(request.nextUrl.searchParams.get("token") ?? undefined, now);
  const app = parseApp(String(claims?.app ?? ""));
  const back = (target?: string | null) => NextResponse.redirect(new URL(loginUrl(parseApp(target ?? "")), requestOrigin(request)));
  if (!claims || !app) return back();
  const sites = sitesOnHost(request.headers.get("host") ?? "");
  if (sites && !hostServes(sites, SITE_OF[app])) return new NextResponse("Not found", { status: 404 });
  const actor = actorForStaff(readState(), claims.staffId);
  if (!actor?.role || !APP_INFO[app].roles.includes(actor.role)) return back(app);
  if (!consumeHandoff(claims.nonce, claims.exp, now)) return back(app);
  const session = await signSession({ staffId: claims.staffId, role: actor.role, app, exp: now + SESSION_HOURS * 60 * 60 * 1000 });
  const response = NextResponse.redirect(new URL(safeNext(app, request.nextUrl.searchParams.get("next")), requestOrigin(request)));
  response.cookies.set(cookieName(app), session, cookieOptions(request));
  return response;
}
