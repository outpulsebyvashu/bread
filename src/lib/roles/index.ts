// Roles mirror the `app_role` enum in supabase/schema.sql.
// Six separate apps, each with its own login, session and home-screen install.
// Routes here are UX only: the engine re-checks every command and view on the server.
export const ROLES = ["admin", "manager", "cashier", "captain", "kitchen"] as const;
export type Role = (typeof ROLES)[number];

export const APPS = ["pos", "captain", "kitchen", "items", "manager", "admin"] as const;
export type AppId = (typeof APPS)[number];

type AppInfo = {
  name: string;
  tagline: string;
  home: string;
  login: string;
  roles: readonly Role[];
  // Server views this app's session may read. Admin can read all of them, to run every screen.
  views: readonly string[];
  colour: string;
  letter: string;
};

export const APP_INFO: Record<AppId, AppInfo> = {
  pos: {
    name: "POS",
    tagline: "Bill queue, checkout, payments and cash shifts for cashiers",
    home: "/pos",
    login: "/login?app=pos",
    roles: ["cashier", "manager", "admin"],
    views: ["till", "team"],
    colour: "#c9d29a",
    letter: "P",
  },
  captain: {
    name: "Captain",
    tagline: "Tables, ordering, live orders and checkout on the floor",
    home: "/captain",
    login: "/login?app=captain",
    roles: ["captain", "manager", "admin"],
    views: ["floor", "team"],
    colour: "#f7c9d8",
    letter: "C",
  },
  kitchen: {
    name: "Kitchen",
    tagline: "Ticket board with sound alerts, KOT print and sold-out",
    home: "/kds",
    login: "/login?app=kitchen",
    roles: ["kitchen", "manager", "admin"],
    views: ["kds", "team"],
    colour: "#f2cf63",
    letter: "K",
  },
  items: {
    name: "Items",
    tagline: "One switch per item to turn it on or off for customers and staff",
    home: "/items",
    login: "/login?app=items",
    roles: ["kitchen", "manager", "admin"],
    views: ["items"],
    colour: "#d6f23a",
    letter: "I",
  },
  manager: {
    name: "Manager",
    tagline: "Live floor, approvals, stock, reports and day close",
    home: "/manager",
    login: "/login?app=manager",
    roles: ["manager", "admin"],
    views: ["manager", "team"],
    colour: "#c5d0f7",
    letter: "M",
  },
  admin: {
    name: "POS Admin",
    tagline: "Owner dashboard and master controls, including every other app",
    home: "/admin",
    login: "/login?app=admin",
    roles: ["admin"],
    views: ["admin", "till", "floor", "kds", "items", "manager", "team"],
    colour: "#d9cff7",
    letter: "A",
  },
};

export function parseRole(value: string | undefined): Role | null {
  return ROLES.find((role) => role === value) ?? null;
}

export function parseApp(value: string | undefined): AppId | null {
  return APPS.find((app) => app === value) ?? null;
}

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// One login for every app. It lives on its own domain (auth) when domains are configured.
export function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/logout" || matches(pathname, "/auth");
}

export function isPublicPath(pathname: string) {
  return pathname === "/" || matches(pathname, "/customer") || isLoginPath(pathname) || matches(pathname, "/offline") || matches(pathname, "/o");
}

// The app that owns a page, if any.
export function routeFor(pathname: string) {
  const app = APPS.find((id) => matches(pathname, APP_INFO[id].home)) ?? null;
  return app ? { app, roles: APP_INFO[app].roles } : null;
}

const DEFAULT_APP: Record<Role, AppId> = { cashier: "pos", kitchen: "kitchen", captain: "captain", manager: "manager", admin: "admin" };

// After signing in, people go to the app they asked for if their role allows it, otherwise to their own app.
export function landingApp(role: Role, requested?: AppId | null): AppId {
  return requested && APP_INFO[requested].roles.includes(role) ? requested : DEFAULT_APP[role];
}

// Each app has one home screen.
export function homeFor(app: AppId) {
  return APP_INFO[app].home;
}

export function canOpen(app: AppId, role: Role) {
  return APP_INFO[app].roles.includes(role);
}
