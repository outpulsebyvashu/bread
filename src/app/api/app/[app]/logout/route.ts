import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logoutUrl } from "@/lib/hosts";
import { parseApp } from "@/lib/roles";
import { cookieName } from "@/lib/session/token";

// Signs out of this app, and tells the screen to end the shared sign-in on the login domain too.
export async function POST(_request: Request, { params }: { params: Promise<{ app: string }> }) {
  const app = parseApp((await params).app);
  if (app) (await cookies()).delete(cookieName(app));
  return NextResponse.json({ ok: true, login: logoutUrl() });
}
