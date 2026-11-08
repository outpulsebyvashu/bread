import { cookies } from "next/headers";
import { actorForStaff } from "@/lib/pos/engine";
import { readState } from "@/lib/pos/store";
import { APP_INFO, type AppId } from "@/lib/roles";
import { cookieName, verifySession } from "./token";

// Resolves the signed-in person for one app. Role and active status come from the
// current staff record, so a deactivated person loses access immediately.
export async function getActor(app: AppId) {
  const session = await verifySession((await cookies()).get(cookieName(app))?.value, app);
  if (!session) return null;
  const actor = actorForStaff(readState(), session.staffId);
  if (!actor?.role || !APP_INFO[app].roles.includes(actor.role)) return null;
  return actor;
}
