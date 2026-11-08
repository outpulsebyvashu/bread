import { NextResponse, type NextRequest } from "next/server";
import { canOpen, isPublicPath, routeFor } from "@/lib/roles";
import { hostServes, loginUrl, requestOrigin, siteForPath, sitesOnHost } from "@/lib/hosts";
import { cookieName, verifySession } from "@/lib/session/token";

// UX gating only: every API call re-checks the session and role on the server.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sites = sitesOnHost(request.headers.get("host") ?? "");
  const origin = requestOrigin(request);

  // With domains configured, each domain serves only its own apps. The rest do not exist there.
  const need = siteForPath(pathname);
  if (sites && need && !hostServes(sites, need)) return new NextResponse("Not found", { status: 404 });

  if (pathname === "/" && sites) {
    if (sites.includes("customer")) return NextResponse.redirect(new URL("/customer", origin));
    return NextResponse.redirect(sites.includes("auth") ? new URL("/login", origin) : new URL(loginUrl(), origin));
  }
  if (isPublicPath(pathname)) return NextResponse.next();

  const route = routeFor(pathname);
  if (!route) return NextResponse.next();

  const session = await verifySession(request.cookies.get(cookieName(route.app))?.value, route.app);
  if (!session || !canOpen(route.app, session.role)) {
    return NextResponse.redirect(new URL(loginUrl(route.app, pathname), origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|icons/|sw.js|manifests/).*)"],
};
