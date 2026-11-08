import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/hosts";
import { SSO_COOKIE } from "@/lib/session/token";

// Ends the sign-in remembered on the login domain, then shows the login again.
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", requestOrigin(request)));
  response.cookies.delete(SSO_COOKIE);
  return response;
}
