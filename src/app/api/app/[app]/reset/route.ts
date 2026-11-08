import { NextResponse } from "next/server";
import { unauthenticated } from "@/lib/pos/http";
import { resetDemo } from "@/lib/pos/store";
import { parseApp } from "@/lib/roles";
import { getActor } from "@/lib/session";

// Owner-only: restores the sample outlet. Removed with the demo store at the Supabase stage.
export async function POST(_request: Request, { params }: { params: Promise<{ app: string }> }) {
  const app = parseApp((await params).app);
  if (app !== "admin") return unauthenticated();
  const actor = await getActor(app);
  if (actor?.role !== "admin") return unauthenticated();
  resetDemo();
  return NextResponse.json({ ok: true });
}
