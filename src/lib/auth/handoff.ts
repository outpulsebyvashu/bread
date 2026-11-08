import { randomUUID } from "node:crypto";
import { appOrigin, safeNext } from "@/lib/hosts";
import type { AppId, Role } from "@/lib/roles";
import { HANDOFF_SECONDS, signHandoff } from "@/lib/session/token";

// The link that carries someone from the login domain to the app they should land in.
export async function handoffUrl(staff: { id: string; role: Role }, app: AppId, next: unknown, now: number) {
  const token = await signHandoff({ staffId: staff.id, role: staff.role, app, exp: now + HANDOFF_SECONDS * 1000, nonce: randomUUID() });
  return `${appOrigin(app)}/auth/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(safeNext(app, next))}`;
}
