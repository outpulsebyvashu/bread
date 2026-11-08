import { NextResponse } from "next/server";
import { errorResponse, noStore, unauthenticated } from "@/lib/pos/http";
import { readState, tickOutbox } from "@/lib/pos/store";
import { view } from "@/lib/pos/views";
import { APP_INFO, parseApp } from "@/lib/roles";
import { getActor } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ app: string; name: string }> }) {
  const { app: appParam, name } = await params;
  const app = parseApp(appParam);
  if (!app || name === "qr") return unauthenticated();
  const actor = await getActor(app);
  if (!actor) return unauthenticated(app);
  if (!APP_INFO[app].views.includes(name)) return NextResponse.json({ error: "This app cannot open that screen", code: "forbidden" }, { status: 403 });
  try {
    const now = Date.now();
    tickOutbox(now);
    return noStore({ me: { name: actor.name, role: actor.role, staffId: actor.staffId }, data: view(readState(), actor, name, now) });
  } catch (error) {
    return errorResponse(error);
  }
}
