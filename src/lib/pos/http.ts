import { NextResponse } from "next/server";
import { loginUrl } from "../hosts";
import type { AppId } from "../roles";
import { PosError } from "./engine";

const STATUS: Record<string, number> = { forbidden: 403, settle_not_allowed: 403, unauthenticated: 401, bad_qr: 404, unknown_view: 404, unknown_command: 404 };

export function errorResponse(error: unknown) {
  if (error instanceof PosError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: STATUS[error.code] ?? 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong", code: "server_error" }, { status: 500 });
}

export const unauthenticated = (app?: AppId) => NextResponse.json({ error: "Please sign in", code: "unauthenticated", login: loginUrl(app) }, { status: 401 });
export const noStore = (body: unknown) => NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
