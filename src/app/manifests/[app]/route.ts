import { NextResponse } from "next/server";
import { appManifest } from "@/lib/install";
import { parseApp } from "@/lib/roles";

export async function GET(_request: Request, { params }: { params: Promise<{ app: string }> }) {
  const app = parseApp((await params).app);
  if (!app) return NextResponse.json({ error: "Unknown app" }, { status: 404 });
  return NextResponse.json(appManifest(app), { headers: { "Content-Type": "application/manifest+json" } });
}
