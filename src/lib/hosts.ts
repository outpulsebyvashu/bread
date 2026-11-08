// Which domain serves which app. Set these in production; leave them empty to run everything on one host.
//   AUTH_ORIGIN       the single login          e.g. https://auth.niro.cards
//   BREAD_ORIGIN      POS, Kitchen, Manager, Items   https://bread.niro.cards
//   WORKFORCE_ORIGIN  Captain                   https://workforce.niro.cards
//   ADMIN_ORIGIN      POS Admin                 https://admin.outpulse.company
//   CUSTOMER_ORIGIN   customer ordering         https://niro.cards
import { APP_INFO, routeFor, type AppId } from "./roles/index.ts";

export type Site = "auth" | "bread" | "workforce" | "admin" | "customer";

export const SITE_OF: Record<AppId, Site> = { pos: "bread", kitchen: "bread", items: "bread", manager: "bread", captain: "workforce", admin: "admin" };
const ENV_NAME: Record<Site, string> = { auth: "AUTH_ORIGIN", bread: "BREAD_ORIGIN", workforce: "WORKFORCE_ORIGIN", admin: "ADMIN_ORIGIN", customer: "CUSTOMER_ORIGIN" };
const SITES = Object.keys(ENV_NAME) as Site[];

// Empty string means "this same host", so local development needs no setup.
export function siteOrigin(site: Site) {
  return (process.env[ENV_NAME[site]] ?? "").trim().replace(/\/+$/, "");
}

export const appOrigin = (app: AppId) => siteOrigin(SITE_OF[app]);
export const hostsConfigured = () => SITES.some((site) => siteOrigin(site) !== "");

// The sites this host serves, or null when no domains are configured (everything is served).
export function sitesOnHost(host: string): Site[] | null {
  if (!hostsConfigured()) return null;
  const wanted = host.trim().toLowerCase();
  return SITES.filter((site) => {
    const origin = siteOrigin(site);
    if (!origin) return false;
    try {
      return new URL(origin).host.toLowerCase() === wanted;
    } catch {
      return false;
    }
  });
}

// The address the browser actually used. The server's own idea of its address (request.url) can be
// localhost, so redirects must be built from the Host header, or from the configured domain for it.
export function requestOrigin(request: Request) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  if (!host) return new URL(request.url).origin;
  const configured = SITES.map(siteOrigin).find((origin) => {
    try {
      return origin !== "" && new URL(origin).host.toLowerCase() === host.toLowerCase();
    } catch {
      return false;
    }
  });
  if (configured) return configured;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function loginUrl(app?: AppId | null, next?: string | null) {
  const query = new URLSearchParams();
  if (app) query.set("app", app);
  if (next) query.set("next", next);
  const text = query.toString();
  return `${siteOrigin("auth")}/login${text ? `?${text}` : ""}`;
}

export const logoutUrl = () => `${siteOrigin("auth")}/logout`;

// Where a path may be served. "apps" means any staff site (the sign-in hand-off lands there).
export function siteForPath(pathname: string): Site | "apps" | null {
  if (pathname === "/login" || pathname === "/logout") return "auth";
  if (pathname === "/auth/callback") return "apps";
  const route = routeFor(pathname);
  if (route) return SITE_OF[route.app];
  if (pathname === "/customer" || pathname.startsWith("/customer/") || pathname === "/o" || pathname.startsWith("/o/")) return "customer";
  return null;
}

export function hostServes(sites: Site[], need: Site | "apps") {
  return need === "apps" ? sites.some((site) => site === "bread" || site === "workforce" || site === "admin") : sites.includes(need);
}

// Only the app's own pages are allowed as a landing path, so a login link can never send someone elsewhere.
export function safeNext(app: AppId, next: unknown) {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.includes("://") || next.includes("..")) return APP_INFO[app].home;
  const path = next.split("?")[0].split("#")[0];
  return routeFor(path)?.app === app ? next : APP_INFO[app].home;
}
