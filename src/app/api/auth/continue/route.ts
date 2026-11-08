import { cookies } from "next/headers";
import { handoffUrl } from "@/lib/auth/handoff";
import { actorForStaff } from "@/lib/pos/engine";
import { errorResponse, noStore, unauthenticated } from "@/lib/pos/http";
import { readState } from "@/lib/pos/store";
import { landingApp, parseApp } from "@/lib/roles";
import { SSO_COOKIE, verifySso } from "@/lib/session/token";

// Someone already signed in on this domain moves between apps without typing their PIN again.
export async function POST(request: Request) {
  try {
    const sso = await verifySso((await cookies()).get(SSO_COOKIE)?.value);
    if (!sso) return unauthenticated();
    const staff = readState().staff.find((row) => row.id === sso.staffId && row.active);
    if (!staff || !actorForStaff(readState(), staff.id)?.role) return unauthenticated();
    const body = (await request.json().catch(() => ({}))) as { app?: unknown; next?: unknown };
    const requested = parseApp(String(body.app ?? ""));
    const app = landingApp(staff.role, requested);
    return noStore({ redirect: await handoffUrl(staff, app, requested === app ? body.next : null, Date.now()), app });
  } catch (error) {
    return errorResponse(error);
  }
}
