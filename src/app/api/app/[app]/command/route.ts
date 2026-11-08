import { errorResponse, noStore, unauthenticated } from "@/lib/pos/http";
import { runCommand } from "@/lib/pos/store";
import { parseApp } from "@/lib/roles";
import { getActor } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ app: string }> }) {
  const app = parseApp((await params).app);
  if (!app) return unauthenticated();
  const actor = await getActor(app);
  if (!actor) return unauthenticated(app);
  try {
    const body = (await request.json()) as { type?: unknown; args?: unknown };
    return noStore({ result: runCommand(actor, String(body.type), body.args) ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}
