import assert from "node:assert/strict";
import { test } from "node:test";
import type { Role } from "../roles/index.ts";
import { actorFor, actorForStaff, attemptLogin, dayCloseProblems, dispatch, PosError, shiftExpectedCash } from "./engine.ts";
import { view } from "./views.ts";
import { allocate, financialYear, priceLines } from "./money.ts";
import { DEMO_MANAGER_PIN, DEMO_NIRO_OTP, createSeedState } from "./seed.ts";
import type { Bill, CartItem, Check, PosState } from "./types.ts";

const NOW = Date.UTC(2026, 10, 5, 6, 0, 0);

class World {
  state: PosState;
  now = NOW;
  constructor(configure = true) {
    this.state = createSeedState(NOW);
    if (configure) {
      this.state.settings.gstin = "29ABCDE1234F1Z5";
      this.state.settings.fssai = "11223344556677";
    }
  }
  run(role: Role | null, type: string, args: unknown = {}) {
    const { state, result } = dispatch(this.state, actorFor(this.state, role), type, args, this.now);
    this.state = state;
    return result as Record<string, never>;
  }
  rejects(role: Role | null, type: string, args: unknown, code?: string) {
    assert.throws(
      () => this.run(role, type, args),
      (error: unknown) => {
        assert.ok(error instanceof PosError, String(error));
        if (code) assert.equal(error.code, code);
        return true;
      },
    );
  }
  check(id: string): Check {
    return this.state.checks.find((row) => row.id === id)!;
  }
  bill(id: string): Bill {
    return this.state.bills.find((row) => row.id === id)!;
  }
  order(tableId: string | null, items: CartItem[] = [{ itemId: "croissant", qty: 2 }]) {
    return (this.run("captain", "send_items", { tableId, items }) as unknown as { checkId: string }).checkId;
  }
  issue(checkId: string): Bill {
    const { billIds } = this.run("cashier", "issue_bills", { checkId, mode: "single" }) as unknown as { billIds: string[] };
    return this.bill(billIds[0]);
  }
  stock(id: string) {
    return this.state.ingredients.find((row) => row.id === id)!.stock;
  }
}

const reason = (value: string, pin?: string) => ({ reason: value, pin });

test("allocate always adds up exactly", () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
  assert.equal(allocate(9999, [3, 7, 11]).reduce((a, b) => a + b), 9999);
  assert.deepEqual(allocate(50, [0, 10]), [0, 50]);
});

test("tax is 2.5 + 2.5 after discount, with a labelled round-off", () => {
  const priced = priceLines(
    [{ lineId: "a", itemId: "a", name: "A", mods: [], qtyLabel: "1", qtySold: 1, grossP: 33000, comp: false, taxClassId: "t" }],
    3000,
    { taxMode: "regular", pricesInclusive: false, roundOff: true },
    [{ id: "t", name: "t", ratePct: 5, sacHsn: "996331" }],
  );
  assert.equal(priced.taxableP, 30000);
  assert.equal(priced.cgstP, 750);
  assert.equal(priced.sgstP, 750);
  assert.equal(priced.totalP, 31500);
  assert.equal(priced.roundOffP, 0);
});

test("inclusive prices extract tax, and composition charges none", () => {
  const input = [{ lineId: "a", itemId: "a", name: "A", mods: [], qtyLabel: "1", qtySold: 1, grossP: 10500, comp: false, taxClassId: "t" }];
  const taxClasses = [{ id: "t", name: "t", ratePct: 5, sacHsn: "" }];
  const inclusive = priceLines(input, 0, { taxMode: "regular", pricesInclusive: true, roundOff: false }, taxClasses);
  assert.equal(inclusive.taxableP, 10000);
  assert.equal(inclusive.totalP, 10500);
  const composition = priceLines(input, 0, { taxMode: "composition", pricesInclusive: false, roundOff: false }, taxClasses);
  assert.equal(composition.cgstP + composition.sgstP, 0);
  assert.equal(composition.totalP, 10500);
});

test("financial year rolls over on 1 April", () => {
  assert.equal(financialYear("2026-11-05"), "2627");
  assert.equal(financialYear("2027-03-31"), "2627");
  assert.equal(financialYear("2027-04-01"), "2728");
});

test("rounds accumulate on one running check, with a KOT per station", () => {
  const world = new World();
  const id = world.order("T1", [
    { itemId: "croissant", qty: 1 },
    { itemId: "sourdough_toast", qty: 1 },
  ]);
  assert.equal(world.state.kots.length, 2);
  world.run("captain", "send_items", { checkId: id, items: [{ itemId: "americano", qty: 1 }] });
  assert.equal(world.state.checks.length, 1);
  assert.equal(world.check(id).lines.length, 3);
  assert.equal(world.check(id).round, 2);
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "americano", qty: 1 }] });
});

test("the server sets prices and enforces required modifiers", () => {
  const world = new World();
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "cappuccino", qty: 1 }] }, "modifier_required");
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "cappuccino", qty: 1, modifierIds: ["cappuccino_whole", "cappuccino_oat"] }] }, "modifier_limit");
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "cappuccino", qty: 1, modifierIds: ["cappuccino_whole", "latte_oat"] }] });
  const id = world.order("T1", [{ itemId: "cappuccino", qty: 1, unitP: 1, modifierIds: ["cappuccino_oat"] } as CartItem]);
  assert.equal(world.check(id).lines[0].unitP, 24000);
});

test("failed commands change nothing", () => {
  const world = new World();
  const before = JSON.stringify(world.state);
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "croissant", qty: 1 }, { itemId: "cappuccino", qty: 1 }] });
  assert.equal(JSON.stringify(world.state), before);
});

test("role permissions are enforced by the engine", () => {
  const world = new World();
  const id = world.order("T1");
  world.rejects("kitchen", "send_items", { tableId: "T2", items: [{ itemId: "croissant", qty: 1 }] }, "forbidden");
  world.rejects("kitchen", "issue_bills", { checkId: id, mode: "single" }, "forbidden");
  world.rejects("captain", "cancel_bill", { billId: "x" }, "forbidden");
  world.rejects("captain", "bump_kot", { kotId: "x" }, "forbidden");
  world.rejects("cashier", "update_settings", { patch: {} }, "forbidden");
  world.rejects("manager", "update_settings", { patch: {} }, "forbidden");
  world.rejects("manager", "upsert_item", {}, "forbidden");
  world.rejects("cashier", "day_close", {}, "forbidden");
  world.rejects(null, "send_items", {}, "forbidden");
  world.rejects("admin", "constructor", {}, "unknown_command");
  world.rejects("admin", "__proto__", {}, "unknown_command");
});

test("kitchen can 86 an item, which blocks every channel, and day close resets it", () => {
  const world = new World();
  world.run("kitchen", "set_availability", { itemId: "croissant", mode: "day" });
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "croissant", qty: 1 }] }, "sold_out");
  const token = world.state.tables[0].qrToken;
  world.rejects(null, "qr_place", { token, items: [{ itemId: "croissant", qty: 1 }] }, "sold_out");
  world.run("manager", "day_close");
  world.order("T1");
});

test("timed 86 expires by itself, and a sold-out modifier blocks only that option", () => {
  const world = new World();
  world.run("kitchen", "set_availability", { itemId: "croissant", mode: "hours", hours: 2 });
  world.rejects("captain", "send_items", { tableId: "T1", items: [{ itemId: "croissant", qty: 1 }] }, "sold_out");
  world.now += 3 * 60 * 60 * 1000;
  world.order("T1");
  world.run("kitchen", "set_availability", { modifierId: "latte_oat", mode: "indefinite" });
  world.rejects("captain", "send_items", { tableId: "T2", items: [{ itemId: "latte", qty: 1, modifierIds: ["latte_oat"] }] }, "sold_out");
  world.order("T2", [{ itemId: "latte", qty: 1, modifierIds: ["latte_whole"] }]);
});

test("recipes deduct on fire, including modifiers; running out blocks the item", () => {
  const world = new World();
  const beans = world.stock("beans");
  const oat = world.stock("oat_milk");
  world.order("T1", [{ itemId: "latte", qty: 2, modifierIds: ["latte_oat", "latte_shot"] }]);
  assert.equal(world.stock("beans"), beans - 2 * (18 + 9));
  assert.equal(world.stock("oat_milk"), oat - 0.4);
  world.run("manager", "stock_move", { ingredientId: "croissant_stock", kind: "waste", qty: 24, reason: "Burnt" });
  world.rejects("captain", "send_items", { tableId: "T2", items: [{ itemId: "croissant", qty: 1 }] }, "sold_out");
  world.run("manager", "stock_move", { ingredientId: "croissant_stock", kind: "receive", qty: 5, reason: "Delivery" });
  world.order("T2");
  assert.ok(world.state.stockMoves.some((move) => move.kind === "waste"));
});

test("held items take no stock until fired, and can be removed freely", () => {
  const world = new World();
  const before = world.stock("croissant_stock");
  const id = world.order("T1", [{ itemId: "croissant", qty: 1, hold: true }, { itemId: "americano", qty: 1 }]);
  const held = world.check(id).lines[0];
  assert.equal(held.status, "held");
  assert.equal(world.stock("croissant_stock"), before);
  world.run("captain", "fire_held", { checkId: id });
  assert.equal(world.check(id).lines[0].status, "new");
  assert.equal(world.stock("croissant_stock"), before - 1);
  const second = world.order("T2", [{ itemId: "croissant", qty: 1, hold: true }]);
  world.run("captain", "remove_unsent", { lineId: world.check(second).lines[0].id });
  assert.equal(world.check(second).open, false);
});

test("voids follow the item's state: not started returns stock, started is wasted", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "croissant", qty: 2 }, { itemId: "sourdough_toast", qty: 1 }]);
  const stock = world.stock("croissant_stock");
  const [croissant, toast] = world.check(id).lines;
  world.rejects("captain", "void_line", { lineId: croissant.id, approval: reason("Wrong item punched") }, "pin_required");
  world.rejects("captain", "void_line", { lineId: croissant.id, approval: reason("Wrong item punched", "9999") }, "pin_wrong");
  world.rejects("captain", "void_line", { lineId: croissant.id, approval: { pin: DEMO_MANAGER_PIN, reason: "" } });
  world.run("captain", "void_line", { lineId: croissant.id, approval: reason("Wrong item punched", DEMO_MANAGER_PIN) });
  assert.equal(world.stock("croissant_stock"), stock + 2);
  assert.ok(world.state.kots.find((kot) => kot.id === croissant.kotId)!.alert.includes("Cancelled"));

  world.run("kitchen", "bump_kot", { kotId: toast.kotId });
  const toastStock = world.stock("sourdough");
  world.run("manager", "void_line", { lineId: toast.id, approval: reason("Kitchen error") });
  assert.equal(world.stock("sourdough"), toastStock);
  assert.equal(world.check(id).lines[1].stock, "wasted");
  assert.equal(world.check(id).open, false, "a check with everything voided closes");
  const approval = world.state.approvals.find((row) => row.action === "void");
  assert.equal(approval?.requester, "Asha");
  assert.equal(approval?.approver, "Dev (manager)");
});

test("five wrong PINs lock approvals, even though each attempt is rolled back", () => {
  const world = new World();
  const id = world.order("T1");
  const lineId = world.check(id).lines[0].id;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    world.rejects("captain", "void_line", { lineId, approval: reason("Other", "0001") }, "pin_wrong");
  }
  world.rejects("captain", "void_line", { lineId, approval: reason("Other", DEMO_MANAGER_PIN) }, "pin_locked");
  world.now += 61_000;
  world.run("captain", "void_line", { lineId, approval: reason("Other", DEMO_MANAGER_PIN) });
});

test("cashier discount cap needs a PIN above the limit and cannot be bypassed", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "focaccia_sandwich", qty: 1 }]);
  world.rejects("cashier", "set_discount", { checkId: id, amountP: 1000, approval: { reason: "" } });
  world.run("cashier", "set_discount", { checkId: id, amountP: 3200, approval: reason("Regular guest") });
  assert.equal(world.check(id).discountP, 3200);
  world.rejects("cashier", "set_discount", { checkId: id, amountP: 3201, approval: reason("Regular guest") }, "pin_required");
  world.rejects("cashier", "set_discount", { checkId: id, amountP: 3201, niroRef: "fake", approval: reason("Regular guest") }, "pin_required");
  world.run("cashier", "set_discount", { checkId: id, amountP: 5000, approval: reason("Service recovery", DEMO_MANAGER_PIN) });
  assert.equal(world.check(id).discountP, 5000);
  world.rejects("captain", "set_discount", { checkId: id, amountP: 100, approval: reason("Other") }, "forbidden");
});

test("billing is blocked until the outlet's GST details exist", () => {
  const world = new World(false);
  const id = world.order("T1");
  world.rejects("cashier", "issue_bills", { checkId: id, mode: "single" }, "setup_incomplete");
  world.run("admin", "update_settings", { patch: { gstin: "29ABCDE1234F1Z5" } });
  world.rejects("cashier", "issue_bills", { checkId: id, mode: "single" }, "setup_incomplete");
  world.run("admin", "update_settings", { patch: { fssai: "11223344556677" } });
  world.issue(id);
  world.rejects("admin", "update_settings", { patch: { fssai: "123" } });
  world.rejects("admin", "update_settings", { patch: { gstin: "NOTAGSTIN" } });
});

test("serials are consecutive per financial year and never reused", () => {
  const world = new World();
  const first = world.issue(world.order("T1"));
  const second = world.issue(world.order("T2"));
  assert.equal(first.no, "INV/2627/000001");
  assert.equal(second.no, "INV/2627/000002");
  assert.ok(first.no.length <= 16);
  world.run("cashier", "cancel_bill", { billId: second.id, approval: reason("Billing mistake", DEMO_MANAGER_PIN) });
  assert.equal(world.bill(second.id).status, "cancelled");
  assert.equal(world.bill(second.id).no, "INV/2627/000002");
  const third = world.issue(second.checkId);
  assert.equal(third.no, "INV/2627/000003");
  assert.equal(third.lines.length, 1);
});

test("composition mode issues a bill of supply, and tax mode locks after the first bill", () => {
  const world = new World();
  world.run("admin", "update_settings", { patch: { taxMode: "composition" } });
  const bill = world.issue(world.order("T1"));
  assert.equal(bill.docType, "bill_of_supply");
  assert.equal(bill.cgstP + bill.sgstP, 0);
  assert.equal(bill.no, "BOS/2627/000001");
  world.rejects("admin", "update_settings", { patch: { taxMode: "regular" } });
});

test("a bill stays frozen when settings or prices change later", () => {
  const world = new World();
  const bill = world.issue(world.order("T1"));
  const snapshot = JSON.stringify(bill);
  world.run("admin", "update_settings", { patch: { legalName: "New name" } });
  world.run("admin", "upsert_item", { id: "croissant", name: "Croissant", categoryId: "bakery", priceP: 99900, veg: true, stationId: "pastry", taxClassId: "restaurant_5" });
  assert.equal(JSON.stringify(world.bill(bill.id)), snapshot);
});

test("even split adds up to the single-bill subtotal, tax and discount", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "croissant", qty: 1 }, { itemId: "focaccia_sandwich", qty: 1 }]);
  world.run("manager", "set_discount", { checkId: id, amountP: 1000, approval: reason("Promotion") });
  const { billIds } = world.run("cashier", "issue_bills", { checkId: id, mode: "even", parts: 3 }) as unknown as { billIds: string[] };
  const bills = billIds.map((billId) => world.bill(billId));
  assert.equal(bills.length, 3);
  assert.equal(bills.reduce((sum, bill) => sum + bill.subtotalP, 0), 47000);
  assert.equal(bills.reduce((sum, bill) => sum + bill.discountP, 0), 1000);
  assert.equal(new Set(bills.map((bill) => bill.no)).size, 3);
});

test("item split keeps the discount proportional, and every item must be placed", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "croissant", qty: 1 }, { itemId: "focaccia_sandwich", qty: 1 }]);
  world.run("manager", "set_discount", { checkId: id, amountP: 4700, approval: reason("Promotion") });
  const [a, b] = world.check(id).lines;
  world.rejects("cashier", "issue_bills", { checkId: id, mode: "items", groups: [[a.id], []] });
  world.rejects("cashier", "issue_bills", { checkId: id, mode: "items", groups: [[a.id], [a.id, b.id]] });
  const { billIds } = world.run("cashier", "issue_bills", { checkId: id, mode: "items", groups: [[a.id], [b.id]] }) as unknown as { billIds: string[] };
  assert.equal(world.bill(billIds[0]).discountP, 1500);
  assert.equal(world.bill(billIds[1]).discountP, 3200);
});

test("kitchen tickets are unchanged by a bill split", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "croissant", qty: 1 }, { itemId: "cinnamon_roll", qty: 1 }]);
  const kots = world.state.kots.length;
  const [a, b] = world.check(id).lines;
  world.run("cashier", "issue_bills", { checkId: id, mode: "items", groups: [[a.id], [b.id]] });
  assert.equal(world.state.kots.length, kots);
});

test("tender guards: no overpayment, no paying twice, retries are safe, cash needs a shift", () => {
  const world = new World();
  const bill = world.issue(world.order("T1"));
  world.rejects("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP }, "shift_required");
  world.rejects("manager", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP }, "shift_required");
  world.run("cashier", "open_shift", { floatP: 200000 });
  world.rejects("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP + 100, tenderedP: bill.totalP + 100 });
  world.rejects("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: 100 });
  const first = world.run("cashier", "pay_cash", { billId: bill.id, amountP: 10000, tenderedP: 10000, key: "k1" });
  const retry = world.run("cashier", "pay_cash", { billId: bill.id, amountP: 10000, tenderedP: 10000, key: "k1" });
  assert.deepEqual(first, retry);
  assert.equal(world.state.payments.length, 1);
  assert.equal(world.bill(bill.id).paid, false);
  const change = world.run("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP - 10000, tenderedP: 50000 }) as unknown as { changeP: number };
  assert.equal(change.changeP, 50000 - (bill.totalP - 10000));
  assert.equal(world.bill(bill.id).paid, true);
  world.rejects("cashier", "pay_card", { billId: bill.id, amountP: 100 });
});

test("the table stays occupied when paid but still cooking, then frees on serve", () => {
  const world = new World();
  const id = world.order("T1");
  const bill = world.issue(id);
  world.run("cashier", "open_shift", { floatP: 0 });
  world.run("cashier", "pay_card", { billId: bill.id, amountP: bill.totalP });
  assert.equal(world.check(id).open, true);
  const kotId = world.check(id).lines[0].kotId;
  world.run("kitchen", "bump_kot", { kotId });
  world.run("kitchen", "bump_kot", { kotId });
  world.run("captain", "serve_check", { checkId: id });
  assert.equal(world.check(id).open, false);
  world.order("T1");
});

test("UPI stays pending until the provider confirms; a late credit is held, not applied", () => {
  const world = new World();
  const bill = world.issue(world.order("T1"));
  world.run("cashier", "open_shift", { floatP: 0 });
  const first = world.run("cashier", "upi_create", { billId: bill.id, amountP: bill.totalP }) as unknown as { paymentId: string };
  assert.equal(world.bill(bill.id).paid, false);
  world.rejects("cashier", "upi_create", { billId: bill.id, amountP: bill.totalP });
  world.rejects("cashier", "close_shift", { countedP: 0 });
  assert.ok(dayCloseProblems(world.state).some((problem) => problem.includes("UPI")));

  world.run("cashier", "upi_close", { paymentId: first.paymentId });
  const second = world.run("cashier", "upi_create", { billId: bill.id, amountP: bill.totalP }) as unknown as { paymentId: string };
  world.run("cashier", "upi_provider_event", { paymentId: first.paymentId, event: "success" });
  assert.equal(world.state.payments.find((row) => row.id === first.paymentId)!.status, "unmatched");
  assert.equal(world.bill(bill.id).paid, false);

  world.run("cashier", "upi_provider_event", { paymentId: second.paymentId, event: "success", rrn: "RRN1" });
  world.run("cashier", "upi_provider_event", { paymentId: second.paymentId, event: "success", rrn: "RRN1" });
  assert.equal(world.bill(bill.id).paid, true);
});

test("a failed UPI can be retried, and static QR is recorded as unverified with a reason", () => {
  const world = new World();
  const bill = world.issue(world.order("T1"));
  world.run("cashier", "open_shift", { floatP: 0 });
  const { paymentId } = world.run("cashier", "upi_create", { billId: bill.id, amountP: bill.totalP }) as unknown as { paymentId: string };
  world.run("cashier", "upi_provider_event", { paymentId, event: "failure" });
  assert.equal(world.bill(bill.id).paid, false);
  world.rejects("cashier", "upi_mark_received", { billId: bill.id, amountP: bill.totalP, reason: "" });
  const done = world.run("cashier", "upi_mark_received", { billId: bill.id, amountP: bill.totalP, reason: "Provider down" }) as unknown as { paymentId: string };
  const payment = world.state.payments.find((row) => row.id === done.paymentId)!;
  assert.equal(payment.verified, false);
  assert.equal(world.bill(bill.id).paid, true);
  world.rejects("cashier", "upi_verify", { paymentId: done.paymentId }, "forbidden");
  world.run("manager", "upi_verify", { paymentId: done.paymentId, ref: "RRN9" });
});

test("shift close hides expected cash until counted, and big variance needs a PIN", () => {
  const world = new World();
  world.run("cashier", "open_shift", { floatP: 100000 });
  const bill = world.issue(world.order("T1"));
  world.run("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP });
  world.run("cashier", "cash_move", { kind: "out", amountP: 5000, reason: "Milk run" });
  world.rejects("cashier", "cash_move", { kind: "out", amountP: 5000, reason: "" });
  const shift = world.state.shifts[0];
  const expected = shiftExpectedCash(world.state, shift);
  assert.equal(expected, 100000 + bill.totalP - 5000);
  world.rejects("cashier", "close_shift", { countedP: expected - 20000 }, "variance_approval");
  world.rejects("cashier", "close_shift", { countedP: expected - 20000, approval: { reason: "Short" } }, "pin_required");
  const closed = world.run("cashier", "close_shift", { countedP: expected - 20000, approval: { reason: "Short", pin: DEMO_MANAGER_PIN } }) as unknown as { varianceP: number };
  assert.equal(closed.varianceP, -20000);
  assert.equal(world.state.shifts[0].approvedBy, "Dev (manager)");
});

test("small variance closes without approval", () => {
  const world = new World();
  world.run("cashier", "open_shift", { floatP: 100000 });
  const closed = world.run("cashier", "close_shift", { countedP: 99950 }) as unknown as { varianceP: number };
  assert.equal(closed.varianceP, -50);
});

test("moving to a free table works; occupied needs merge, which can be undone", () => {
  const world = new World();
  const a = world.order("T1");
  world.run("captain", "move_check", { checkId: a, toTableId: "T5" });
  assert.equal(world.check(a).tableId, "T5");
  assert.ok(world.state.kots[0].alert.includes("T5"));

  const b = world.order("T6", [{ itemId: "cinnamon_roll", qty: 1 }]);
  world.rejects("captain", "move_check", { checkId: a, toTableId: "T6" }, "table_occupied");
  world.run("captain", "move_check", { checkId: a, toTableId: "T6", merge: true });
  assert.equal(world.check(a).open, false);
  assert.equal(world.check(b).lines.length, 2);

  world.run("captain", "undo_merge", { checkId: a });
  assert.equal(world.check(a).open, true);
  assert.equal(world.check(a).lines.length, 1);
  assert.equal(world.check(b).lines.length, 1);
  assert.equal(world.check(a).lines[0].checkId, a);
});

test("merge is blocked once a bill exists", () => {
  const world = new World();
  const a = world.order("T1");
  world.order("T2");
  world.issue(a);
  world.rejects("captain", "move_check", { checkId: a, toTableId: "T2", merge: true });
});

test("KOT bump moves forward, recall works only in its window", () => {
  const world = new World();
  const id = world.order("T1");
  const kotId = world.check(id).lines[0].kotId!;
  world.run("kitchen", "bump_kot", { kotId });
  assert.equal(world.check(id).lines[0].status, "preparing");
  world.run("kitchen", "bump_kot", { kotId });
  assert.equal(world.check(id).lines[0].status, "ready");
  world.rejects("kitchen", "bump_kot", { kotId });
  world.run("kitchen", "recall_kot", { kotId });
  assert.equal(world.check(id).lines[0].status, "preparing");
  world.run("kitchen", "bump_kot", { kotId });
  world.now += 6 * 60 * 1000;
  world.rejects("kitchen", "recall_kot", { kotId });
});

test("a table QR joins the running bill, and a closed session does not leak to new guests", () => {
  const world = new World();
  const token = world.state.tables[0].qrToken;
  world.rejects(null, "qr_place", { token: "fake", items: [{ itemId: "croissant", qty: 1 }] }, "bad_qr");
  const stock = world.stock("croissant_stock");
  const first = world.run(null, "qr_place", { token, items: [{ itemId: "croissant", qty: 1 }] }) as unknown as { checkId: string };
  assert.equal(world.check(first.checkId).qrPending, true);
  assert.equal(world.check(first.checkId).lines[0].status, "awaiting");
  assert.equal(world.stock("croissant_stock"), stock, "no stock until accepted");
  assert.equal(world.state.kots.length, 0);
  world.run("captain", "qr_accept", { checkId: first.checkId });
  assert.equal(world.check(first.checkId).lines[0].status, "new");

  const second = world.run(null, "qr_place", { token, items: [{ itemId: "cinnamon_roll", qty: 1 }] }) as unknown as { checkId: string };
  assert.equal(second.checkId, first.checkId);
  assert.equal(world.check(first.checkId).lines[1].status, "new", "later rounds auto-fire");

  world.run(null, "qr_request_bill", { token });
  assert.equal(world.check(first.checkId).billRequested, true);
});

test("a rejected QR order frees the table and takes no stock", () => {
  const world = new World();
  const token = world.state.tables[0].qrToken;
  const stock = world.stock("croissant_stock");
  const { checkId } = world.run(null, "qr_place", { token, items: [{ itemId: "croissant", qty: 1 }] }) as unknown as { checkId: string };
  world.run("cashier", "qr_reject", { checkId, reason: "Kitchen closing" });
  assert.equal(world.check(checkId).open, false);
  assert.equal(world.stock("croissant_stock"), stock);
});

test("anonymous guests cannot attach a member without OTP or use staff commands", () => {
  const world = new World();
  const token = world.state.tables[0].qrToken;
  world.run(null, "qr_place", { token, items: [{ itemId: "croissant", qty: 1 }] });
  world.rejects(null, "qr_niro_signin", { token, phone: "9000000001", otp: "000000", loyalty: true });
  world.rejects(null, "niro_attach", { checkId: world.state.checks[0].id, memberId: "niro_1" }, "forbidden");
  world.rejects(null, "qr_niro_signin", { token, phone: "9000000001", otp: DEMO_NIRO_OTP, loyalty: false });
  world.run(null, "qr_niro_signin", { token, phone: "9000000001", otp: DEMO_NIRO_OTP, loyalty: true, offers: false });
  assert.equal(world.state.checks[0].niroMemberId, "niro_1");
  assert.deepEqual(world.state.consents.map((row) => row.purpose), ["loyalty"]);
});

test("Niro: redeem needs OTP, earn is queued, retried when down, and idempotent", async () => {
  const { drainNiroOutbox } = await import("./engine.ts");
  const world = new World();
  const id = world.order("T1", [{ itemId: "focaccia_sandwich", qty: 2 }]);
  world.run("cashier", "niro_attach", { checkId: id, memberId: "niro_1" });
  world.rejects("cashier", "niro_redeem", { checkId: id, rewardId: "reward_coffee", otp: "1" });
  world.run("cashier", "niro_redeem", { checkId: id, rewardId: "reward_coffee", otp: DEMO_NIRO_OTP });
  const member = () => world.state.niroMembers.find((row) => row.id === "niro_1")!;
  assert.equal(member().points, 140);
  const bill = world.issue(id);
  assert.equal(bill.discountP, 10000);
  world.run("cashier", "open_shift", { floatP: 0 });

  world.run("admin", "set_niro_down", { down: true });
  world.run("cashier", "pay_card", { billId: bill.id, amountP: bill.totalP });
  assert.equal(world.bill(bill.id).paid, true, "billing works while Niro is down");
  drainNiroOutbox(world.state);
  assert.equal(world.state.niroOutbox[0].status, "pending");
  assert.equal(member().points, 140);

  world.run("admin", "set_niro_down", { down: false });
  drainNiroOutbox(world.state);
  assert.equal(world.state.niroOutbox[0].status, "done");
  const earned = member().points;
  assert.ok(earned > 140);
  world.state.niroOutbox[0].status = "pending";
  drainNiroOutbox(world.state);
  assert.equal(member().points, earned, "a repeated delivery does not double credit");
});

test("paid bills need a credit note, which links back and reverses Niro", () => {
  const world = new World();
  const id = world.order("T1");
  world.run("cashier", "niro_attach", { checkId: id, memberId: "niro_1" });
  const bill = world.issue(id);
  world.run("cashier", "open_shift", { floatP: 100000 });
  world.run("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP });
  world.rejects("cashier", "cancel_bill", { billId: bill.id, approval: reason("Billing mistake", DEMO_MANAGER_PIN) });
  const { creditNoteId } = world.run("cashier", "credit_note", { billId: bill.id, refundMethod: "cash", approval: reason("Refund to guest", DEMO_MANAGER_PIN) }) as unknown as { creditNoteId: string };
  const note = world.bill(creditNoteId);
  assert.equal(note.originalId, bill.id);
  assert.equal(note.no, "CN/2627/000001");
  assert.equal(world.bill(bill.id).status, "credited");
  assert.ok(world.state.niroOutbox.some((row) => row.kind === "reverse"));
  assert.equal(shiftExpectedCash(world.state, world.state.shifts[0]), 100000, "refund leaves the drawer");
});

test("day close blocks on open work, then saves a Z report and starts a new date", () => {
  const world = new World();
  const id = world.order("T1");
  world.rejects("manager", "day_close", {}, "day_close_blocked");
  const bill = world.issue(id);
  world.run("cashier", "open_shift", { floatP: 0 });
  world.run("cashier", "pay_card", { billId: bill.id, amountP: bill.totalP });
  const kotId = world.check(id).lines[0].kotId;
  world.run("kitchen", "bump_kot", { kotId });
  world.run("kitchen", "bump_kot", { kotId });
  world.run("captain", "serve_check", { checkId: id });
  world.rejects("manager", "day_close", {}, "day_close_blocked");
  world.run("cashier", "close_shift", { countedP: 0 });
  const startDate = world.state.businessDate;
  const { report } = world.run("manager", "day_close") as unknown as { report: { totalP: number; tenders: { card: number }; cgstP: number } };
  assert.equal(report.totalP, bill.totalP);
  assert.equal(report.tenders.card, bill.totalP);
  assert.equal(report.cgstP, bill.cgstP);
  assert.notEqual(world.state.businessDate, startDate);
  assert.equal(world.state.dayCloses.length, 1);
});

test("the audit log records commands without secrets", () => {
  const world = new World();
  const id = world.order("T1");
  const lineId = world.check(id).lines[0].id;
  world.run("captain", "void_line", { lineId, approval: reason("Other", DEMO_MANAGER_PIN) });
  const row = world.state.audit.find((entry) => entry.type === "void_line")!;
  assert.equal(row.actor, "Asha");
  assert.ok(!row.detail.includes(DEMO_MANAGER_PIN));
});

test("login checks phone, PIN and app, logs every attempt, and locks after five failures", () => {
  const { state } = new World();
  const allowed = ["captain", "manager", "admin"] as const;
  const asha = "9800000011";
  assert.throws(() => attemptLogin(state, asha, "0000", "captain", allowed, NOW), /Wrong phone number or PIN/);
  assert.throws(() => attemptLogin(state, "9811115678", "1111", "captain", allowed, NOW), /Wrong phone number or PIN/);
  assert.throws(() => attemptLogin(state, "12345", "1111", "captain", allowed, NOW), /10-digit/);
  assert.equal(attemptLogin(state, `+91 ${asha}`, "1111", "captain", allowed, NOW).name, "Asha");
  assert.throws(() => attemptLogin(state, "9800000021", "2222", "captain", allowed, NOW), /cannot sign in/);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.throws(() => attemptLogin(state, asha, "0000", "captain", allowed, NOW));
  }
  assert.throws(() => attemptLogin(state, asha, "1111", "captain", allowed, NOW), /Too many/);
  assert.equal(attemptLogin(state, asha, "1111", "captain", allowed, NOW + 61_000).name, "Asha");
  assert.ok(state.logins.some((row) => !row.ok && row.detail === "unknown number"));
  const logged = JSON.stringify(state.logins);
  assert.ok(!logged.includes("1111") && !logged.includes(asha) && !logged.includes("9811115678"));
});

test("staff phone numbers are required, valid and unique", () => {
  const world = new World();
  world.rejects("admin", "upsert_staff", { name: "New", role: "captain", pin: "4444" });
  world.rejects("admin", "upsert_staff", { name: "New", role: "captain", phone: "123", pin: "4444" });
  world.rejects("admin", "upsert_staff", { name: "New", role: "captain", phone: "9800000011", pin: "4444" });
  world.run("admin", "upsert_staff", { name: "New", role: "captain", phone: "+91 98000 00099", pin: "4444" });
  assert.equal(world.state.staff.at(-1)?.phone, "9800000099");
  world.run("admin", "upsert_staff", { id: "s_captain", name: "Asha", role: "captain", canSettle: false });
  assert.equal(world.state.staff.find((row) => row.id === "s_captain")?.phone, "9800000011");
});

test("a customer who signs in to Niro before ordering keeps it on their first order only", () => {
  const world = new World();
  const table = world.state.tables[0];
  const guest = { token: table.qrToken, phone: "9000000001", otp: "123456", loyalty: true, offers: false };
  world.run(null, "qr_niro_signin", guest);
  const { checkId } = world.run(null, "qr_place", { token: table.qrToken, items: [{ itemId: "croissant", qty: 1 }] }) as unknown as { checkId: string };
  assert.equal(world.state.checks.find((row) => row.id === checkId)?.niroMemberId, "niro_1");
  assert.equal(world.state.qrNiroPending?.[table.id], undefined);
});

test("a captain checks out only when allowed, and cash goes in a bag they must count", () => {
  const world = new World();
  const id = world.order("T1");
  const bill = world.issue(id);
  const rohan = actorForStaff(world.state, "s_captain2")!;
  assert.throws(
    () => dispatch(world.state, rohan, "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP }, world.now),
    (error: unknown) => error instanceof PosError && error.code === "settle_not_allowed",
  );
  world.run("captain", "clock_in");
  world.run("captain", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP });
  assert.equal(world.bill(bill.id).paid, true);
  world.rejects("captain", "clock_out", {});
  world.rejects("captain", "set_discount", { checkId: id, amountP: 100, approval: reason("Other") }, "forbidden");
  world.run("captain", "close_shift", { countedP: bill.totalP });
  world.run("captain", "clock_out");
  assert.ok(world.state.clock[0].outAt);
});

test("clock and roster follow the rules", () => {
  const world = new World();
  world.run("kitchen", "clock_in");
  world.rejects("kitchen", "clock_in", {});
  world.rejects("captain", "roster_upsert", { staffId: "s_captain", date: "2026-11-05", start: "09:00", end: "17:00" }, "forbidden");
  world.run("manager", "roster_upsert", { staffId: "s_captain", date: "2026-11-05", start: "09:00", end: "17:00", section: "Floor" });
  world.rejects("manager", "roster_upsert", { staffId: "s_captain", date: "soon", start: "09:00", end: "17:00" });
  assert.equal(world.state.roster[0].staffName, "Asha");
  world.run("manager", "roster_delete", { id: world.state.roster[0].id });
  assert.equal(world.state.roster.length, 0);
});

test("views: kitchen never sees money, staff PINs never leave, and expected cash stays hidden", () => {
  const world = new World();
  const id = world.order("T1", [{ itemId: "focaccia_sandwich", qty: 1 }]);
  const kds = JSON.stringify(view(world.state, actorFor(world.state, "kitchen"), "kds", NOW));
  assert.ok(kds.includes("Focaccia"));
  assert.ok(!/priceP|unitP|totalP|amountP|payments|discount/i.test(kds));
  assert.throws(() => view(world.state, actorFor(world.state, "kitchen"), "till", NOW));
  assert.throws(() => view(world.state, actorFor(world.state, "cashier"), "admin", NOW));
  assert.throws(() => view(world.state, actorFor(world.state, null), "floor", NOW));

  world.run("cashier", "open_shift", { floatP: 100000 });
  const bill = world.issue(id);
  world.run("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP });
  const till = view(world.state, actorFor(world.state, "cashier"), "till", NOW) as unknown as { shift: Record<string, unknown> };
  assert.ok(!("expectedP" in till.shift));
  for (const name of ["floor", "till", "manager", "admin", "team"]) {
    const data = JSON.stringify(view(world.state, actorFor(world.state, "admin"), name, NOW));
    assert.ok(!data.includes("pinHash"), name);
  }
  const guest = JSON.stringify(view(world.state, actorFor(world.state, null), "qr", NOW, { token: world.state.tables[0].qrToken }));
  assert.ok(!/gstin|payments|pinHash|phone|staffId/i.test(guest));
});

// ----- Customer pay and item switches -----
function placedByGuest(world: World) {
  const table = world.state.tables[0];
  world.state.settings.qrMode = "auto";
  world.run(null, "qr_place", { token: table.qrToken, items: [{ itemId: "croissant", qty: 2 }, { itemId: "americano", qty: 1 }] });
  return table;
}

test("a customer can pay their own table's bill from the QR, once", () => {
  const world = new World();
  const table = placedByGuest(world);
  const first = world.run(null, "qr_pay_start", { token: table.qrToken, key: "k1" }) as unknown as { paymentId: string; amountP: number; billNo: string };
  assert.equal(first.amountP, 47300);
  assert.equal(world.state.bills.length, 1);
  const again = world.run(null, "qr_pay_start", { token: table.qrToken, key: "k2" }) as unknown as { paymentId: string };
  assert.equal(again.paymentId, first.paymentId);
  assert.equal(world.state.bills.length, 1);
  assert.equal(world.state.payments.filter((row) => row.status === "pending").length, 1);
  world.run(null, "qr_pay_event", { token: table.qrToken, paymentId: first.paymentId, event: "success" });
  assert.equal(world.state.bills[0].paid, true);
  assert.equal(world.state.payments[0].status, "confirmed");
  assert.equal(world.state.payments[0].shiftId, null);
});

test("customer pay waits for staff to accept the order and respects demo mode", () => {
  const world = new World();
  const table = world.state.tables[0];
  world.run(null, "qr_place", { token: table.qrToken, items: [{ itemId: "croissant", qty: 1 }] });
  world.rejects(null, "qr_pay_start", { token: table.qrToken });
  world.rejects(null, "qr_pay_start", { token: world.state.tables[1].qrToken }, undefined);
  world.run("cashier", "qr_accept", { checkId: world.state.checks[0].id });
  world.state.settings.demoMode = false;
  world.rejects(null, "qr_pay_start", { token: table.qrToken }, "pay_unavailable");
  world.state.settings.demoMode = true;
  assert.ok(world.run(null, "qr_pay_start", { token: table.qrToken }));
});

test("a guest cannot confirm or cancel another table's payment", () => {
  const world = new World();
  const mine = placedByGuest(world);
  const other = world.state.tables[1];
  world.run(null, "qr_place", { token: other.qrToken, items: [{ itemId: "croissant", qty: 1 }] });
  const { paymentId } = world.run(null, "qr_pay_start", { token: mine.qrToken }) as unknown as { paymentId: string };
  world.rejects(null, "qr_pay_event", { token: other.qrToken, paymentId, event: "success" });
  world.rejects(null, "qr_pay_cancel", { token: other.qrToken, paymentId });
  assert.equal(world.state.payments.find((row) => row.id === paymentId)?.status, "pending");
  world.run(null, "qr_pay_cancel", { token: mine.qrToken, paymentId });
  assert.equal(world.state.payments.find((row) => row.id === paymentId)?.status, "closed");
  assert.ok(!JSON.stringify(view(world.state, actorFor(world.state, null), "qr", NOW, { token: mine.qrToken })).includes("pinHash"));
});

test("item switches: one command turns an item off until switched back on, and kitchen sees no prices", () => {
  const world = new World();
  const list = () => view(world.state, actorFor(world.state, "kitchen"), "items", NOW) as { items: { id: string; on: boolean }[] };
  assert.equal(list().items.find((row) => row.id === "croissant")?.on, true);
  world.run("kitchen", "set_availability", { itemId: "croissant", mode: "indefinite" });
  assert.equal(list().items.find((row) => row.id === "croissant")?.on, false);
  world.rejects(null, "qr_place", { token: world.state.tables[0].qrToken, items: [{ itemId: "croissant", qty: 1 }] });
  world.run("manager", "set_availability", { itemId: "croissant", mode: "available" });
  assert.equal(list().items.find((row) => row.id === "croissant")?.on, true);
  assert.ok(!/priceP|unitP|totalP/.test(JSON.stringify(list())));
  assert.throws(() => view(world.state, actorFor(world.state, "cashier"), "items", NOW), /cannot see/);
  assert.throws(() => view(world.state, actorFor(world.state, "captain"), "items", NOW), /cannot see/);
  world.rejects("cashier", "set_availability", { itemId: "croissant", mode: "indefinite" }, "forbidden");
  world.rejects("kitchen", "set_availability", { itemId: "croissant", mode: "none" });
  world.rejects("kitchen", "set_availability", { itemId: "croissant", mode: "<script>" });
  assert.equal(world.state.items.find((row) => row.id === "croissant")?.soldOut, "none");
});
