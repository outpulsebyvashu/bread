// Starting data for the local demo: a sample outlet in the middle of a service.
import { actorFor, dispatch, drainNiroOutbox } from "./engine.ts";
import { createSeedState } from "./seed.ts";
import { istDate } from "./money.ts";
import type { CartItem, DayReport, PosState } from "./types.ts";
import type { Role } from "../roles/index.ts";

const MINUTE = 60_000;

function historyReport(businessDate: string, totalP: number): DayReport {
  const taxableP = Math.round(totalP / 1.05);
  const tax = totalP - taxableP;
  const cash = Math.round(totalP * 0.3);
  const card = Math.round(totalP * 0.15);
  return {
    businessDate,
    billCount: Math.round(totalP / 34000),
    orderCount: Math.round(totalP / 34000),
    grossP: taxableP,
    discountP: 0,
    taxableP,
    cgstP: Math.floor(tax / 2),
    sgstP: tax - Math.floor(tax / 2),
    roundOffP: 0,
    totalP,
    creditNotesP: 0,
    averageBillP: 34000,
    tenders: { cash, card, upi: totalP - cash - card },
    channels: { dine_in: Math.round(totalP * 0.7), qr: Math.round(totalP * 0.2), takeaway: totalP - Math.round(totalP * 0.7) - Math.round(totalP * 0.2) },
    hourly: [],
    topItems: [],
    ticketMinutes: 11,
    leakage: { voids: 0, comps: 0, reprints: 0, cancelledBills: 0, creditNotes: 0, unverifiedUpi: 0, otherReasons: 0, discountsByUser: [] },
    upi: { confirmedP: totalP - cash - card, unverifiedP: 0, pending: 0, unmatched: 0 },
    variances: [],
  };
}

export function createDemoState(now: number): PosState {
  let state = createSeedState(now);
  state.settings.gstin = "29ABCDE1234F1Z5";
  state.settings.fssai = "10000000000000";

  // Six earlier days of sample totals for the weekly chart.
  [5210000, 6840000, 7190000, 3980000, 4120000, 4430000].forEach((totalP, index) => {
    const at = now - (6 - index) * 24 * 60 * MINUTE;
    state.dayCloses.push({ businessDate: istDate(at), closedAt: at, closedBy: "Sample data", report: historyReport(istDate(at), totalP) });
  });

  const start = now - 180 * MINUTE;
  const run = (role: Role, type: string, args: unknown, at: number) => {
    const result = dispatch(state, actorFor(state, role), type, args, at);
    state = result.state;
    return result.result as Record<string, never>;
  };
  const order = (tableId: string | null, items: CartItem[], at: number, channel?: string) =>
    (run("captain", "send_items", { tableId, items, channel }, at) as unknown as { checkId: string }).checkId;
  const lineKots = (checkId: string) => [...new Set(state.checks.find((check) => check.id === checkId)!.lines.map((line) => line.kotId!))];
  const finishKitchen = (checkId: string, at: number) => {
    for (const kotId of lineKots(checkId)) {
      run("kitchen", "bump_kot", { kotId }, at);
      run("kitchen", "bump_kot", { kotId }, at + 8 * MINUTE);
    }
  };

  run("cashier", "open_shift", { floatP: 200000 }, start);
  run("captain", "clock_in", {}, start);
  run("kitchen", "clock_in", {}, start);
  run("cashier", "clock_in", {}, start);

  // Finished earlier today, so the reports have something to show.
  const finished: { items: CartItem[]; method: "cash" | "card" | "upi" }[] = [
    { items: [{ itemId: "cappuccino", qty: 2, modifierIds: ["cappuccino_whole"] }, { itemId: "croissant", qty: 2 }], method: "upi" },
    { items: [{ itemId: "focaccia_sandwich", qty: 2 }, { itemId: "cold_brew", qty: 2 }], method: "cash" },
    { items: [{ itemId: "latte", qty: 1, modifierIds: ["latte_oat"] }, { itemId: "banana_bread", qty: 1 }], method: "card" },
    { items: [{ itemId: "shakshuka", qty: 2 }, { itemId: "masala_chai", qty: 2 }], method: "upi" },
    { items: [{ itemId: "sourdough_toast", qty: 1, modifierIds: ["toast_avo"] }, { itemId: "americano", qty: 2 }], method: "cash" },
  ];
  finished.forEach(({ items, method }, index) => {
    const at = start + index * 30 * MINUTE;
    const checkId = order(`T${index + 7}`, items, at);
    finishKitchen(checkId, at + 2 * MINUTE);
    run("captain", "serve_check", { checkId }, at + 12 * MINUTE);
    const { billIds } = run("cashier", "issue_bills", { checkId, mode: "single" }, at + 20 * MINUTE) as unknown as { billIds: string[] };
    const bill = state.bills.find((row) => row.id === billIds[0])!;
    if (method === "cash") run("cashier", "pay_cash", { billId: bill.id, amountP: bill.totalP, tenderedP: bill.totalP }, at + 21 * MINUTE);
    if (method === "card") run("cashier", "pay_card", { billId: bill.id, amountP: bill.totalP, ref: "demo" }, at + 21 * MINUTE);
    if (method === "upi") {
      const { paymentId } = run("cashier", "upi_create", { billId: bill.id, amountP: bill.totalP }, at + 21 * MINUTE) as unknown as { paymentId: string };
      run("cashier", "upi_provider_event", { paymentId, event: "success" }, at + 22 * MINUTE);
    }
  });

  // Live service.
  const preparing = order("T2", [{ itemId: "focaccia_sandwich", qty: 1 }, { itemId: "cold_brew", qty: 1 }], now - 9 * MINUTE);
  for (const kotId of lineKots(preparing)) run("kitchen", "bump_kot", { kotId }, now - 7 * MINUTE);
  order("T3", [{ itemId: "cappuccino", qty: 2, modifierIds: ["cappuccino_whole"] }, { itemId: "croissant", qty: 1 }], now - 2 * MINUTE);
  const ready = order("T5", [{ itemId: "sourdough_toast", qty: 1 }, { itemId: "masala_chai", qty: 1 }], now - 16 * MINUTE);
  finishKitchen(ready, now - 14 * MINUTE);
  const billRequested = order("T6", [{ itemId: "shakshuka", qty: 1 }, { itemId: "americano", qty: 1 }], now - 40 * MINUTE);
  finishKitchen(billRequested, now - 38 * MINUTE);
  run("captain", "serve_check", { checkId: billRequested }, now - 25 * MINUTE);
  run("captain", "request_bill", { checkId: billRequested }, now - 3 * MINUTE);
  run(null as never, "qr_place", { token: state.tables[0].qrToken, items: [{ itemId: "cinnamon_roll", qty: 2 }, { itemId: "cold_brew", qty: 1 }] }, now - MINUTE);

  const today = state.businessDate;
  for (const [staffId, start_, end, section] of [
    ["s_captain", "09:00", "17:00", "Floor"],
    ["s_captain2", "14:00", "22:00", "Floor"],
    ["s_kitchen", "08:00", "16:00", "Kitchen"],
    ["s_cashier", "09:00", "18:00", "Counter"],
  ]) {
    run("manager", "roster_upsert", { staffId, date: today, start: start_, end, section }, start);
  }
  drainNiroOutbox(state);
  return state;
}
