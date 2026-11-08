import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { hostServes, hostsConfigured, loginUrl, logoutUrl, requestOrigin, safeNext, siteForPath, sitesOnHost, SITE_OF } from "./hosts.ts";
import { APPS } from "./roles/index.ts";

const NAMES = ["AUTH_ORIGIN", "BREAD_ORIGIN", "WORKFORCE_ORIGIN", "ADMIN_ORIGIN", "CUSTOMER_ORIGIN"];
const configure = () => {
  process.env.AUTH_ORIGIN = "https://auth.niro.cards/";
  process.env.BREAD_ORIGIN = "https://bread.niro.cards";
  process.env.WORKFORCE_ORIGIN = "https://workforce.niro.cards";
  process.env.ADMIN_ORIGIN = "https://admin.outpulse.company";
  process.env.CUSTOMER_ORIGIN = "https://niro.cards";
};
afterEach(() => {
  for (const name of NAMES) delete process.env[name];
});

test("with no domains set everything is served on one host and login is local", () => {
  assert.equal(hostsConfigured(), false);
  assert.equal(sitesOnHost("localhost:6001"), null);
  assert.equal(loginUrl("pos"), "/login?app=pos");
  assert.equal(loginUrl(null), "/login");
  assert.equal(logoutUrl(), "/logout");
});

test("each domain serves only its own apps", () => {
  configure();
  assert.deepEqual(sitesOnHost("bread.niro.cards"), ["bread"]);
  assert.deepEqual(sitesOnHost("auth.niro.cards"), ["auth"]);
  assert.deepEqual(sitesOnHost("admin.outpulse.company"), ["admin"]);
  assert.deepEqual(sitesOnHost("niro.cards"), ["customer"]);
  assert.deepEqual(sitesOnHost("evil.example"), []);
  assert.equal(loginUrl("admin", "/admin"), "https://auth.niro.cards/login?app=admin&next=%2Fadmin");
  assert.equal(logoutUrl(), "https://auth.niro.cards/logout");
  const serves = (host: string, path: string) => {
    const need = siteForPath(path);
    return !need || hostServes(sitesOnHost(host) ?? [], need);
  };
  for (const path of ["/pos", "/kds", "/manager", "/items"]) {
    assert.ok(serves("bread.niro.cards", path), path);
    assert.ok(!serves("workforce.niro.cards", path), path);
    assert.ok(!serves("admin.outpulse.company", path), path);
  }
  assert.ok(serves("workforce.niro.cards", "/captain") && !serves("bread.niro.cards", "/captain"));
  assert.ok(serves("admin.outpulse.company", "/admin") && !serves("niro.cards", "/admin") && !serves("bread.niro.cards", "/admin"));
  assert.ok(serves("niro.cards", "/o/main/abc") && serves("niro.cards", "/customer") && !serves("bread.niro.cards", "/o/main/abc"));
  assert.ok(serves("auth.niro.cards", "/login") && !serves("bread.niro.cards", "/login") && !serves("admin.outpulse.company", "/login"));
  assert.ok(serves("bread.niro.cards", "/auth/callback") && serves("workforce.niro.cards", "/auth/callback") && serves("admin.outpulse.company", "/auth/callback"));
  assert.ok(!serves("auth.niro.cards", "/auth/callback") && !serves("niro.cards", "/auth/callback"));
});

test("every app belongs to exactly one staff domain", () => {
  assert.deepEqual(APPS.map((app) => SITE_OF[app]).sort(), ["admin", "bread", "bread", "bread", "bread", "workforce"]);
});

test("a login link can only land inside the app that was asked for", () => {
  assert.equal(safeNext("pos", "/pos"), "/pos");
  assert.equal(safeNext("pos", "/pos?x=1"), "/pos?x=1");
  assert.equal(safeNext("pos", "/manager"), "/pos");
  assert.equal(safeNext("pos", "//evil.example"), "/pos");
  assert.equal(safeNext("pos", "https://evil.example/pos"), "/pos");
  assert.equal(safeNext("pos", "/\\evil.example"), "/pos");
  assert.equal(safeNext("pos", "/pos/../admin"), "/pos");
  assert.equal(safeNext("pos", "/pos/%2e%2e/admin".replace("%2e%2e", "..")), "/pos");
  assert.equal(safeNext("admin", undefined), "/admin");
  assert.equal(safeNext("kitchen", "/kds"), "/kds");
});

test("redirects go back to the address the browser used, not the server's own", () => {
  const asked = (host: string, extra: Record<string, string> = {}) => new Request("http://localhost:6001/x", { headers: { host, ...extra } });
  assert.equal(requestOrigin(asked("192.168.1.23:6001")), "http://192.168.1.23:6001");
  assert.equal(requestOrigin(asked("shop.example", { "x-forwarded-proto": "https" })), "https://shop.example");
  configure();
  assert.equal(requestOrigin(asked("bread.niro.cards")), "https://bread.niro.cards");
  assert.equal(requestOrigin(asked("admin.outpulse.company", { "x-forwarded-proto": "http" })), "https://admin.outpulse.company");
});
