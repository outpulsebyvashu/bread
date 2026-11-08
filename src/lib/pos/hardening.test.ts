// Tests for the audit fixes: PIN storage, QR tokens, the fixed Niro code, settings, staff, reward points.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Role } from "../roles/index.ts";
import { actorFor, attemptLogin, dispatch, PosError } from "./engine.ts";
import { hashPin, isLegacyPinHash, randomToken, verifyPin } from "./pin.ts";
import { createHash } from "node:crypto";
import { DEMO_NIRO_OTP, createLiveState, createSeedState } from "./seed.ts";
import type { PosState } from "./types.ts";

const NOW = Date.UTC(2026, 10, 5, 6, 0, 0);

function world() {
  let state = createSeedState(NOW);
  state.settings.gstin = "29ABCDE1234F1Z5";
  state.settings.fssai = "11223344556677";
  return {
    get state() {
      return state;
    },
    run(role: Role | null, type: string, args: unknown = {}) {
      const out = dispatch(state, actorFor(state, role), type, args, NOW);
      state = out.state;
      return out.result as Record<string, never>;
    },
    rejects(role: Role | null, type: string, args: unknown, code?: string) {
      assert.throws(
        () => dispatch(state, actorFor(state, role), type, args, NOW),
        (error: unknown) => error instanceof PosError && (!code || error.code === code),
      );
    },
  };
}

test("PIN hashes are salted, slow and checked without leaking", () => {
  const a = hashPin("1234");
  const b = hashPin("1234");
  assert.notEqual(a, b, "two people with the same PIN must not share a hash");
  assert.ok(verifyPin(a, "1234") && !verifyPin(a, "1235"));
  assert.ok(!verifyPin("", "1234") && !verifyPin("scrypt$only", "1234"));
  assert.ok(!isLegacyPinHash(a));
});

test("saved sign-ins from before salted hashes still work, then upgrade", () => {
  const { state } = world();
  const asha = state.staff.find((row) => row.id === "s_captain")!;
  asha.pinHash = createHash("sha256").update("breadpos-demo:1111").digest("hex");
  assert.ok(isLegacyPinHash(asha.pinHash));
  assert.throws(() => attemptLogin(state, asha.phone, "9999", "captain", ["captain"], NOW));
  assert.equal(attemptLogin(state, asha.phone, "1111", "captain", ["captain"], NOW + 120_000).id, "s_captain");
  assert.ok(!isLegacyPinHash(asha.pinHash), "hash replaced by a salted one");
  assert.ok(verifyPin(asha.pinHash, "1111"));
});

test("table QR codes are random, not derivable from the table name", () => {
  const w = world();
  const sha = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 12);
  for (const table of w.state.tables) assert.notEqual(table.qrToken, sha(`table-${table.id}`));
  assert.notEqual(randomToken(), randomToken());
  assert.match(randomToken(), /^[A-Za-z0-9_-]{12}$/);
  w.run("admin", "upsert_table", { label: "Patio" });
  const patio = w.state.tables.find((row) => row.label === "Patio")!;
  assert.notEqual(patio.qrToken, createHash("sha256").update(`breadpos-demo:table-${patio.id}`).digest("hex").slice(0, 12));
  const before = patio.qrToken;
  w.run("admin", "rotate_table_qr", { id: patio.id });
  assert.notEqual(w.state.tables.find((row) => row.id === patio.id)!.qrToken, before);
});

test("the fixed Niro code is refused unless demo mode is on", () => {
  const w = world();
  const token = w.state.tables[0].qrToken;
  const guest = { token, phone: "9000000001", otp: DEMO_NIRO_OTP, loyalty: true, offers: false };
  w.run(null, "qr_niro_signin", guest);
  w.run("admin", "update_settings", { patch: { demoMode: false } });
  w.rejects(null, "qr_niro_signin", guest, "niro_unavailable");
  const id = (w.run("captain", "send_items", { tableId: "T1", items: [{ itemId: "focaccia_sandwich", qty: 2 }] }) as unknown as { checkId: string }).checkId;
  w.run("cashier", "niro_attach", { checkId: id, memberId: "niro_1" });
  w.rejects("cashier", "niro_redeem", { checkId: id, rewardId: "reward_coffee", otp: DEMO_NIRO_OTP }, "niro_unavailable");
});

test("settings accept only known fields of the right kind", () => {
  const w = world();
  w.rejects("admin", "update_settings", { patch: { roundOff: "yes" } });
  w.rejects("admin", "update_settings", { patch: { maxCashierDiscountPct: -5 } });
  w.rejects("admin", "update_settings", { patch: { maxCashierDiscountPct: Number.NaN } });
  w.rejects("admin", "update_settings", { patch: { taxMode: "anything" } });
  w.rejects("admin", "update_settings", { patch: { niroOutletCode: "../../x" } });
  w.run("admin", "update_settings", { patch: { shopName: "  Bread Co  ", evil: "x", seq: 0, version: -1 } });
  assert.equal(w.state.settings.shopName, "Bread Co");
  assert.ok(!("evil" in w.state.settings));
  assert.ok(!("seq" in w.state.settings) && !("version" in w.state.settings));
  assert.equal(w.state.seq, 1, "the settings patch cannot reach the rest of the state");
});

test("staff roles are checked and the owner cannot be locked out", () => {
  const w = world();
  w.rejects("admin", "upsert_staff", { name: "X", phone: "9811111111", pin: "5555", role: "superuser" });
  const owner = w.state.staff.find((row) => row.role === "admin")!;
  w.rejects("admin", "upsert_staff", { id: owner.id, name: owner.name, role: "admin", active: false }, "rejected");
  w.rejects("admin", "upsert_staff", { id: owner.id, name: owner.name, role: "manager" });
  w.run("admin", "upsert_staff", { name: "Second owner", phone: "9811111111", pin: "5555", role: "admin" });
  w.run("admin", "upsert_staff", { id: owner.id, name: owner.name, role: "manager" });
  assert.equal(w.state.staff.filter((row) => row.active && row.role === "admin").length, 1);
});

test("Niro points come back when a reward is removed, and one reward cannot be stacked", () => {
  const w = world();
  const id = (w.run("captain", "send_items", { tableId: "T1", items: [{ itemId: "focaccia_sandwich", qty: 2 }] }) as unknown as { checkId: string }).checkId;
  w.run("cashier", "niro_attach", { checkId: id, memberId: "niro_1" });
  const points = () => w.state.niroMembers.find((row) => row.id === "niro_1")!.points;
  assert.equal(points(), 240);
  w.run("cashier", "niro_redeem", { checkId: id, rewardId: "reward_coffee", otp: DEMO_NIRO_OTP });
  assert.equal(points(), 140);
  w.rejects("cashier", "niro_redeem", { checkId: id, rewardId: "reward_big", otp: DEMO_NIRO_OTP }, "reward_applied");
  assert.equal(points(), 140, "a refused second reward takes no points");
  w.run("cashier", "set_discount", { checkId: id, amountP: 0 });
  assert.equal(points(), 240, "removing the discount returns the points");
  w.run("cashier", "niro_redeem", { checkId: id, rewardId: "reward_coffee", otp: DEMO_NIRO_OTP });
  w.run("manager", "set_discount", { checkId: id, amountP: 5000, approval: { reason: "Regular guest" } });
  assert.equal(points(), 240, "replacing the reward with another discount returns the points");
});

test("a live shop starts with one owner and none of the sample accounts", () => {
  assert.throws(() => createLiveState(NOW, "123", "1234"), /OWNER_PHONE/);
  assert.throws(() => createLiveState(NOW, "9811111111", "12"), /OWNER_PIN/);
  const state: PosState = createLiveState(NOW, "+91 98111 11111", "4821");
  assert.equal(state.settings.demoMode, false);
  assert.equal(state.staff.length, 1);
  assert.equal(state.niroMembers.length, 0);
  assert.equal(attemptLogin(state, "9811111111", "4821", "admin", ["admin"], NOW).role, "admin");
  assert.throws(() => attemptLogin(state, "9800000051", "0000", "admin", ["admin"], NOW), /Wrong phone number or PIN/);
});
