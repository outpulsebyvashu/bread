import assert from "node:assert/strict";
import { test } from "node:test";
import { APP_INFO, APPS, canOpen, homeFor, isPublicPath, landingApp, parseRole, routeFor } from "./index.ts";

test("parseRole accepts known roles only", () => {
  assert.equal(parseRole("kitchen"), "kitchen");
  assert.equal(parseRole("owner"), null);
  assert.equal(parseRole(undefined), null);
});

test("six separate apps, each with its own home, login and install", () => {
  assert.deepEqual([...APPS].sort(), ["admin", "captain", "items", "kitchen", "manager", "pos"]);
  const homes = new Set(APPS.map((app) => homeFor(app)));
  assert.equal(homes.size, APPS.length);
  for (const app of APPS) {
    assert.equal(routeFor(homeFor(app))?.app, app);
    assert.equal(APP_INFO[app].login, `/login?app=${app}`);
  }
});

test("apps admit the right roles", () => {
  assert.deepEqual(APP_INFO.admin.roles, ["admin"]);
  assert.deepEqual(APP_INFO.manager.roles, ["manager", "admin"]);
  assert.ok(!APP_INFO.captain.roles.includes("kitchen"));
  assert.ok(!APP_INFO.captain.roles.includes("cashier"));
  assert.ok(!APP_INFO.pos.roles.includes("captain"));
  assert.ok(!APP_INFO.pos.roles.includes("kitchen"));
  assert.ok(!APP_INFO.kitchen.roles.includes("cashier"));
  assert.deepEqual(APP_INFO.items.roles, ["kitchen", "manager", "admin"]);
  assert.deepEqual(APP_INFO.items.views, ["items"]);
  for (const app of APPS) assert.ok(canOpen(app, "admin"), `admin opens ${app}`);
});

test("each app reads only its own screens, and Admin reads all of them", () => {
  assert.ok(!APP_INFO.pos.views.includes("manager"));
  assert.ok(!APP_INFO.kitchen.views.includes("till"));
  assert.ok(!APP_INFO.captain.views.includes("admin"));
  for (const app of APPS) for (const name of APP_INFO[app].views) assert.ok(APP_INFO.admin.views.includes(name), name);
});

test("single-purpose roles are kept out of other apps", () => {
  assert.equal(canOpen("pos", "kitchen"), false);
  assert.equal(canOpen("admin", "captain"), false);
  assert.equal(canOpen("manager", "cashier"), false);
  assert.equal(canOpen("admin", "manager"), false);
  assert.equal(canOpen("items", "cashier"), false);
  assert.equal(canOpen("items", "captain"), false);
});

test("route matching respects path segments", () => {
  assert.equal(isPublicPath("/o/main/abc"), true);
  assert.equal(isPublicPath("/orders"), false);
  assert.equal(isPublicPath("/login"), true);
  assert.equal(isPublicPath("/auth/callback"), true);
  assert.equal(isPublicPath("/logout"), true);
  assert.equal(isPublicPath("/captain/login"), false);
  assert.equal(isPublicPath("/captain"), false);
  assert.equal(isPublicPath("/"), true);
  assert.equal(isPublicPath("/customer"), true);
  assert.equal(isPublicPath("/customers-secret"), false);
  assert.equal(routeFor("/posx"), null);
  assert.equal(routeFor("/admin/anything")?.app, "admin");
});

test("one login sends people to their own app, or the one they asked for if their role allows it", () => {
  assert.equal(landingApp("cashier"), "pos");
  assert.equal(landingApp("kitchen"), "kitchen");
  assert.equal(landingApp("captain"), "captain");
  assert.equal(landingApp("manager"), "manager");
  assert.equal(landingApp("admin"), "admin");
  assert.equal(landingApp("manager", "pos"), "pos");
  assert.equal(landingApp("manager", "items"), "items");
  assert.equal(landingApp("admin", "captain"), "captain");
  assert.equal(landingApp("cashier", "manager"), "pos");
  assert.equal(landingApp("kitchen", "admin"), "kitchen");
  assert.equal(landingApp("captain", "pos"), "captain");
  assert.equal(landingApp("kitchen", null), "kitchen");
});
