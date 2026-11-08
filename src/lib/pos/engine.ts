// The POS rules. Every write goes through dispatch(), which checks the actor's role,
// applies the command to a copy (so a failure changes nothing) and writes the audit log.
// These commands are the specification for the Postgres RPCs at the Supabase step.
import { ROLES, type AppId, type Role } from "../roles/index.ts";
import { financialYear, istDate, priceLines, allocate, type PriceInput } from "./money.ts";
import { dayReport } from "./report.ts";
import { isMobileNumber, normalizePhone } from "../format/index.ts";
import { hashPin, isLegacyPinHash, randomToken, verifyPin } from "./pin.ts";
import { DEMO_NIRO_OTP } from "./seed.ts";
import type {
  Actor,
  Approvalish,
  Bill,
  CartItem,
  Check,
  Item,
  Kot,
  Line,
  Payment,
  PosState,
  Shift,
  Staff,
} from "./types.ts";

export class PosError extends Error {
  code: string;
  constructor(message: string, code = "rejected") {
    super(message);
    this.code = code;
  }
}

const fail = (message: string, code?: string): never => {
  throw new PosError(message, code);
};

const ALL_FLOOR: Role[] = ["captain", "cashier", "manager", "admin"];
const TILL: Role[] = ["cashier", "manager", "admin"];
// Captains can check out at the table only when the owner has switched it on for them.
const CHECKOUT: Role[] = ["captain", "cashier", "manager", "admin"];
const KITCHEN: Role[] = ["kitchen", "manager", "admin"];
const MGMT: Role[] = ["manager", "admin"];
const EVERYONE: Role[] = ["captain", "kitchen", "cashier", "manager", "admin"];
const ADMIN: Role[] = ["admin"];
const RECALL_WINDOW_MS = 5 * 60 * 1000;
const UPI_QR_MS = 15 * 60 * 1000;

const nextId = (state: PosState, prefix: string) => `${prefix}_${(state.seq += 1)}`;

function requireCheck(state: PosState, id: string): Check {
  return state.checks.find((check) => check.id === id) ?? fail("Check not found");
}
function openCheck(state: PosState, id: string): Check {
  const check = requireCheck(state, id);
  if (!check.open) fail("This check is already closed");
  return check;
}
function requireBill(state: PosState, id: string): Bill {
  return state.bills.find((bill) => bill.id === id) ?? fail("Bill not found");
}
function requireKot(state: PosState, id: string): Kot {
  return state.kots.find((kot) => kot.id === id) ?? fail("Ticket not found");
}
function findLine(state: PosState, id: string): { check: Check; line: Line } {
  for (const check of state.checks) {
    const line = check.lines.find((row) => row.id === id);
    if (line) return { check, line };
  }
  return fail("Item not found");
}
const positive = (value: unknown, label: string): number => {
  if (!Number.isInteger(value) || (value as number) <= 0) fail(`${label} must be a positive amount`);
  return value as number;
};
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// ---------- Approvals ----------

function requireReason(state: PosState, kind: keyof PosState["reasonCodes"], reason: unknown) {
  const value = text(reason);
  if (!value) fail("Pick a reason");
  if (!state.reasonCodes[kind].includes(value) && !value.startsWith("Other")) fail("Pick a reason from the list");
  return value;
}

// A missing permission turns into a manager PIN at the point of action, on the requester's session.
function approve(
  state: PosState,
  actor: Actor,
  now: number,
  action: string,
  kind: keyof PosState["reasonCodes"],
  approval: Approvalish | undefined,
  amountP: number,
  ref: string,
) {
  const reason = requireReason(state, kind, approval?.reason);
  let approver: Staff | undefined;
  if (actor.role === "manager" || actor.role === "admin") {
    approver = state.staff.find((row) => row.id === actor.staffId);
  } else {
    if (now < state.pinLockedUntil) fail("Too many wrong PINs. Wait a minute and try again.", "pin_locked");
    const pin = text(approval?.pin);
    if (!pin) fail("Manager PIN needed", "pin_required");
    approver = state.staff.find(
      (row) => row.active && (row.role === "manager" || row.role === "admin") && verifyPin(row.pinHash, pin),
    );
    if (!approver) {
      // Counted outside the rolled-back copy by dispatch().
      throw new PosError("Wrong PIN", "pin_wrong");
    }
  }
  state.pinFails = 0;
  state.approvals.push({
    id: nextId(state, "apr"),
    at: now,
    action,
    requester: actor.name,
    approver: approver?.name ?? actor.name,
    reason,
    amountP,
    ref,
  });
  return reason;
}

// ---------- Availability and stock ----------

const roundQty = (value: number) => Math.round(value * 1000) / 1000;

export function itemSoldOut(state: PosState, item: Item, now: number) {
  if (item.soldOut === "day" || item.soldOut === "indefinite") return true;
  return item.soldOut === "until" && (item.soldOutUntil ?? 0) > now;
}

// Only counts the base recipe: modifier stock is checked when the modifier is chosen.
export function stockBlocked(state: PosState, item: Item) {
  if (item.ignoreStock) return false;
  return state.recipes.some((row) => {
    if (row.ownerId !== item.id) return false;
    const ingredient = state.ingredients.find((entry) => entry.id === row.ingredientId);
    return !!ingredient && ingredient.stock < row.qty;
  });
}

export function itemAvailable(state: PosState, item: Item, now: number) {
  return item.active && !itemSoldOut(state, item, now) && !stockBlocked(state, item);
}

function deductStock(state: PosState, line: Line, actor: Actor, now: number) {
  const item = state.items.find((row) => row.id === line.itemId);
  const owners = [line.itemId, ...line.modifierIds];
  for (const row of state.recipes.filter((entry) => owners.includes(entry.ownerId))) {
    const ingredient = state.ingredients.find((entry) => entry.id === row.ingredientId);
    if (!ingredient) continue;
    const needed = roundQty(row.qty * line.qty);
    if (ingredient.stock < needed && !item?.ignoreStock) fail(`${line.name} is sold out (${ingredient.name} is too low)`, "sold_out");
    ingredient.stock = roundQty(ingredient.stock - needed);
    state.stockMoves.push({
      id: nextId(state, "mv"),
      at: now,
      ingredientId: ingredient.id,
      delta: -needed,
      kind: "sale",
      ref: line.id,
      actor: actor.name,
      reason: line.name,
    });
  }
  line.stock = "deducted";
}

function returnStock(state: PosState, line: Line, actor: Actor, now: number) {
  const owners = [line.itemId, ...line.modifierIds];
  for (const row of state.recipes.filter((entry) => owners.includes(entry.ownerId))) {
    const ingredient = state.ingredients.find((entry) => entry.id === row.ingredientId);
    if (!ingredient) continue;
    const qty = roundQty(row.qty * line.qty);
    ingredient.stock = roundQty(ingredient.stock + qty);
    state.stockMoves.push({
      id: nextId(state, "mv"),
      at: now,
      ingredientId: ingredient.id,
      delta: qty,
      kind: "void_return",
      ref: line.id,
      actor: actor.name,
      reason: line.name,
    });
  }
  line.stock = "returned";
}

// ---------- Rounds and KOTs ----------

function buildLine(state: PosState, check: Check, cart: CartItem, now: number): Line {
  const item = state.items.find((row) => row.id === cart.itemId) ?? fail("Item not found");
  if (!itemAvailable(state, item, now)) fail(`${item.name} is sold out`, "sold_out");
  const qty = cart.qty;
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) fail("Quantity must be between 1 and 99");

  const chosen = [...new Set(cart.modifierIds ?? [])];
  const groups = state.modifierGroups.filter((group) => group.itemId === item.id);
  const modifiers = chosen.map((id) => {
    const modifier = state.modifiers.find((row) => row.id === id) ?? fail("Option not found");
    if (!groups.some((group) => group.id === modifier.groupId)) fail(`That option does not belong to ${item.name}`);
    if (!modifier.available) fail(`${modifier.name} is sold out`, "sold_out");
    return modifier;
  });
  for (const group of groups) {
    const count = modifiers.filter((modifier) => modifier.groupId === group.id).length;
    if (count < group.min) fail(`${item.name}: choose ${group.name}`, "modifier_required");
    if (count > group.max) fail(`${item.name}: at most ${group.max} for ${group.name}`, "modifier_limit");
  }

  return {
    id: nextId(state, "ln"),
    checkId: check.id,
    itemId: item.id,
    name: item.name,
    qty,
    unitP: item.priceP + modifiers.reduce((sum, modifier) => sum + modifier.priceP, 0),
    mods: modifiers.map((modifier) => modifier.name),
    modifierIds: modifiers.map((modifier) => modifier.id),
    note: text(cart.note).slice(0, 140),
    taxClassId: item.taxClassId,
    stationId: item.stationId,
    status: "held",
    kotId: null,
    billId: null,
    stock: "none",
    reason: "",
  };
}

function fireLines(state: PosState, check: Check, lines: Line[], actor: Actor, now: number) {
  if (lines.length === 0) return;
  check.round += 1;
  for (const stationId of [...new Set(lines.map((line) => line.stationId))]) {
    const kot: Kot = {
      id: nextId(state, "kot"),
      no: (state.kotNo += 1),
      checkId: check.id,
      originCheckId: check.id,
      round: check.round,
      stationId,
      at: now,
      acceptedAt: null,
      readyAt: null,
      alert: "",
      reprints: 0,
    };
    state.kots.push(kot);
    for (const line of lines.filter((row) => row.stationId === stationId)) {
      deductStock(state, line, actor, now);
      line.status = "new";
      line.kotId = kot.id;
    }
  }
}

function newCheck(state: PosState, actor: Actor, now: number, tableId: string | null, channel: Check["channel"], covers: number): Check {
  if (tableId) {
    const table = state.tables.find((row) => row.id === tableId && row.active) ?? fail("Table not found");
    if (state.checks.some((check) => check.open && check.tableId === table.id)) fail(`${table.label} already has an open check`);
  }
  const check: Check = {
    id: nextId(state, "chk"),
    no: (state.checkNo += 1),
    tableId,
    channel,
    covers: Math.max(1, Math.floor(covers) || 1),
    open: true,
    billRequested: false,
    waiterCalled: false,
    qrPending: false,
    captain: actor.role === "captain" ? actor.name : "",
    openedAt: now,
    closedAt: null,
    mergedInto: null,
    round: 0,
    lines: [],
    discountP: 0,
    discountReason: "",
    discountBy: "",
    niroRewardRef: "",
    niroRewardId: "",
    niroRewardCost: 0,
    niroMemberId: "",
    businessDate: state.businessDate,
    cancelledReason: "",
  };
  state.checks.push(check);
  return check;
}

const lineCounts = (line: Line) => line.status !== "void";

// Points are taken when a reward is applied, before anyone has paid. If the discount is removed or replaced
// while it is still waiting on the check, the member gets those points back.
function releaseReward(state: PosState, check: Check) {
  if (check.niroRewardId && check.discountP > 0) {
    const member = state.niroMembers.find((row) => row.id === check.niroMemberId);
    const cost = check.niroRewardCost ?? state.niroRewards.find((row) => row.id === check.niroRewardId)?.cost ?? 0;
    if (member) member.points += cost;
  }
  check.niroRewardId = "";
  check.niroRewardRef = "";
  check.niroRewardCost = 0;
}
const kitchenOutstanding = (line: Line) => ["awaiting", "held", "new", "preparing", "ready"].includes(line.status);

// A check closes once everything chargeable is billed and paid and nothing is still on its way.
function maybeClose(state: PosState, check: Check, now: number) {
  if (!check.open) return;
  const live = check.lines.filter(lineCounts);
  const bills = state.bills.filter((bill) => bill.checkId === check.id && bill.status === "issued");
  const emptied = live.length === 0 && check.lines.length > 0;
  const unbilled = live.some((line) => !line.billId && line.status !== "comp");
  const unpaid = bills.some((bill) => !bill.paid);
  const compOnly = live.length > 0 && live.every((line) => line.status === "comp");
  if (emptied || compOnly || (!unbilled && !unpaid && bills.length > 0 && !live.some(kitchenOutstanding))) {
    check.open = false;
    check.closedAt = now;
    check.billRequested = false;
    check.qrPending = false;
  }
}

function touchKotAfterChange(state: PosState, line: Line, message: string) {
  if (!line.kotId) return;
  const kot = state.kots.find((row) => row.id === line.kotId);
  if (kot) kot.alert = message;
}

// ---------- Bills ----------

function nextSerial(state: PosState, docType: Bill["docType"], businessDate: string) {
  const fy = financialYear(businessDate);
  const key = `${docType}:${fy}`;
  state.series[key] = (state.series[key] ?? 0) + 1;
  const prefix = docType === "tax_invoice" ? "INV" : docType === "bill_of_supply" ? "BOS" : "CN";
  return { fy, no: `${prefix}/${fy}/${String(state.series[key]).padStart(6, "0")}` };
}

function tableLabel(state: PosState, check: Check) {
  if (!check.tableId) return check.channel === "takeaway" ? "Takeaway" : "Counter";
  return state.tables.find((table) => table.id === check.tableId)?.label ?? check.tableId;
}

function makeBill(
  state: PosState,
  check: Check,
  actor: Actor,
  now: number,
  inputs: PriceInput[],
  discountP: number,
  discountReason: string,
  shareLabel: string,
  buyer: { gstin?: string; name?: string } | undefined,
): Bill {
  const priced = priceLines(inputs, discountP, state.settings, state.taxClasses);
  const docType = state.settings.taxMode === "composition" ? "bill_of_supply" : "tax_invoice";
  const { fy, no } = nextSerial(state, docType, state.businessDate);
  const { legalName, address, gstin, fssai, shopName } = state.settings;
  const bill: Bill = {
    id: nextId(state, "bill"),
    no,
    docType,
    fy,
    businessDate: state.businessDate,
    checkId: check.id,
    checkNo: check.no,
    tableLabel: tableLabel(state, check),
    channel: check.channel,
    at: now,
    issuedBy: actor.name,
    shareLabel,
    lines: priced.lines,
    subtotalP: priced.subtotalP,
    discountP: priced.discountP,
    discountReason,
    taxableP: priced.taxableP,
    cgstP: priced.cgstP,
    sgstP: priced.sgstP,
    roundOffP: priced.roundOffP,
    totalP: priced.totalP,
    buyerGstin: text(buyer?.gstin).toUpperCase(),
    buyerName: text(buyer?.name),
    status: "issued",
    statusReason: "",
    originalId: "",
    paid: priced.totalP === 0,
    reprints: 0,
    seller: { legalName, address, gstin, fssai, shopName },
  };
  state.bills.push(bill);
  return bill;
}

const toInput = (line: Line, grossP: number, qtyLabel: string, qtySold: number): PriceInput => ({
  lineId: line.id,
  itemId: line.itemId,
  name: line.name,
  mods: line.mods,
  qtyLabel,
  qtySold,
  grossP,
  comp: line.status === "comp",
  taxClassId: line.taxClassId,
});

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

function issueBills(state: PosState, actor: Actor, now: number, args: IssueArgs) {
  const check = openCheck(state, args.checkId);
  if (state.settings.taxMode === "regular" && !state.settings.gstin) {
    fail("Add the outlet GSTIN in Admin settings before billing", "setup_incomplete");
  }
  if (!state.settings.fssai) fail("Add the FSSAI number in Admin settings before billing", "setup_incomplete");
  if (check.qrPending) fail("Accept the QR order before billing");
  const buyerGstin = text(args.buyer?.gstin).toUpperCase();
  if (buyerGstin && !GSTIN_PATTERN.test(buyerGstin)) fail("That GSTIN does not look valid");

  const billable = check.lines.filter((line) => lineCounts(line) && !line.billId && line.status !== "held");
  if (billable.length === 0) fail("Nothing to bill yet");

  const made: Bill[] = [];
  if (args.mode === "single") {
    made.push(
      makeBill(
        state,
        check,
        actor,
        now,
        billable.map((line) => toInput(line, line.unitP * line.qty, String(line.qty), line.qty)),
        check.discountP,
        check.discountReason,
        "",
        args.buyer,
      ),
    );
    for (const line of billable) line.billId = made[0].id;
  } else if (args.mode === "even") {
    const parts = args.parts ?? 0;
    if (!Number.isInteger(parts) || parts < 2 || parts > 20) fail("Split between 2 and 20 people");
    const shares = billable.map((line) => allocate(line.unitP * line.qty, Array(parts).fill(1)));
    const discounts = allocate(check.discountP, Array(parts).fill(1));
    for (let part = 0; part < parts; part += 1) {
      made.push(
        makeBill(
          state,
          check,
          actor,
          now,
          billable.map((line, index) => toInput(line, shares[index][part], `${line.qty}/${parts}`, line.qty / parts)),
          discounts[part],
          check.discountReason,
          `Share ${part + 1} of ${parts}`,
          part === 0 ? args.buyer : undefined,
        ),
      );
    }
    // Even shares all refer to the same lines: the first bill marks them billed.
    for (const line of billable) line.billId = made[0].id;
  } else {
    const groups = args.groups ?? [];
    const assigned = groups.flat();
    if (groups.length < 2 || groups.some((group) => group.length === 0)) fail("Put items on at least two bills");
    if (new Set(assigned).size !== assigned.length) fail("An item is on two bills");
    if (billable.some((line) => !assigned.includes(line.id))) fail("Every item must be on a bill");
    if (assigned.some((id) => !billable.some((line) => line.id === id))) fail("That item cannot be billed");
    const weights = groups.map((group) =>
      group.reduce((sum, id) => {
        const line = billable.find((row) => row.id === id)!;
        return sum + (line.status === "comp" ? 0 : line.unitP * line.qty);
      }, 0),
    );
    // The check discount follows the money, so moving items never silently drops it.
    const discounts = allocate(check.discountP, weights);
    groups.forEach((group, index) => {
      const lines = group.map((id) => billable.find((row) => row.id === id)!);
      const bill = makeBill(
        state,
        check,
        actor,
        now,
        lines.map((line) => toInput(line, line.unitP * line.qty, String(line.qty), line.qty)),
        discounts[index],
        check.discountReason,
        `Bill ${index + 1} of ${groups.length}`,
        index === 0 ? args.buyer : undefined,
      );
      for (const line of lines) line.billId = bill.id;
      made.push(bill);
    });
  }

  check.discountP = 0;
  check.billRequested = false;
  maybeClose(state, check, now);
  return made.map((bill) => bill.id);
}

type IssueArgs = {
  checkId: string;
  mode: "single" | "even" | "items";
  parts?: number;
  groups?: string[][];
  buyer?: { gstin?: string; name?: string };
};

// ---------- Payments ----------

export function billPaidP(state: PosState, billId: string) {
  return state.payments
    .filter((payment) => payment.billId === billId && payment.status === "confirmed")
    .reduce((sum, payment) => sum + payment.amountP, 0);
}

function billDueP(state: PosState, bill: Bill) {
  return bill.totalP - billPaidP(state, bill.id);
}

function payableBill(state: PosState, billId: string, amountP: number) {
  const bill = requireBill(state, billId);
  if (bill.status !== "issued") fail("This bill is cancelled");
  if (bill.paid) fail("This bill is already paid");
  if (amountP > billDueP(state, bill)) fail("That is more than the amount due");
  return bill;
}

function activeShift(state: PosState, actor: Actor) {
  return state.shifts.find((shift) => shift.staffId === actor.staffId && !shift.closedAt) ?? null;
}

function requireShift(state: PosState, actor: Actor, now: number): Shift {
  const shift = activeShift(state, actor);
  if (shift) return shift;
  if (actor.role !== "captain") return fail("Open a shift first", "shift_required");
  // A captain's cash bag opens by itself with the first table checkout.
  const bag: Shift = {
    id: nextId(state, "sh"),
    staffId: actor.staffId ?? "",
    staffName: actor.name,
    openedAt: now,
    closedAt: null,
    floatP: 0,
    moves: [],
    expectedP: null,
    countedP: null,
    varianceP: null,
    note: "",
    approvedBy: "",
    businessDate: state.businessDate,
  };
  state.shifts.push(bag);
  return bag;
}

function afterConfirmed(state: PosState, bill: Bill, now: number) {
  if (billDueP(state, bill) !== 0 || bill.paid) return;
  bill.paid = true;
  const check = requireCheck(state, bill.checkId);
  if (check.niroMemberId) {
    state.niroOutbox.push({
      id: nextId(state, "nx"),
      kind: "earn",
      memberId: check.niroMemberId,
      amountP: bill.totalP,
      orderRef: bill.no,
      status: "pending",
      attempts: 0,
      lastError: "",
      at: now,
    });
  }
  // Even shares share one set of kitchen lines, so check every share before closing.
  maybeClose(state, check, now);
}

// What the payment provider's webhook will do. The demo buttons call it too.
function applyProviderEvent(state: PosState, paymentId: string, event: "success" | "failure", rrn: string | undefined, now: number) {
  const payment = state.payments.find((row) => row.id === paymentId) ?? fail("Payment not found");
  if (event === "failure") {
    if (payment.status === "pending") payment.status = "failed";
    return;
  }
  if (payment.status === "confirmed") return; // Duplicate webhook: safe to ignore.
  payment.ref = text(rrn) || `SIM${payment.id}`;
  const bill = requireBill(state, payment.billId);
  // Money that arrives after the QR closed, or for a settled bill, is held for manual matching.
  if (payment.status !== "pending" || bill.status !== "issued" || payment.amountP > billDueP(state, bill)) {
    payment.status = "unmatched";
    return;
  }
  payment.status = "confirmed";
  payment.verified = true;
  afterConfirmed(state, bill, now);
}

function newPayment(
  state: PosState,
  actor: Actor,
  now: number,
  fields: Pick<Payment, "billId" | "method" | "amountP"> & Partial<Payment>,
): Payment {
  const payment: Payment = {
    id: nextId(state, "pay"),
    shiftId: activeShift(state, actor)?.id ?? null,
    status: "confirmed",
    tenderedP: 0,
    changeP: 0,
    ref: "",
    provider: "",
    verified: true,
    reason: "",
    key: "",
    at: now,
    actor: actor.name,
    expiresAt: null,
    ...fields,
  };
  state.payments.push(payment);
  return payment;
}

const existingByKey = (state: PosState, key: unknown) => {
  const value = text(key);
  return value ? state.payments.find((payment) => payment.key === value) : undefined;
};

// ---------- Niro (mock adapter: API unconfirmed) ----------

function niroEarnPoints(state: PosState, amountP: number) {
  return Math.floor(amountP / 10000) * state.settings.niroPointsPer100;
}

export function drainNiroOutbox(state: PosState) {
  let changed = false;
  for (const row of state.niroOutbox.filter((entry) => entry.status === "pending")) {
    changed = true;
    row.attempts += 1;
    if (state.niroDown) {
      row.lastError = "Niro unreachable";
      if (row.attempts >= 8) row.status = "failed";
      continue;
    }
    const key = `${row.kind}:${row.orderRef}`;
    if (!state.niroLedger.includes(key)) {
      state.niroLedger.push(key);
      const member = state.niroMembers.find((entry) => entry.id === row.memberId);
      const points = niroEarnPoints(state, row.amountP);
      if (member) member.points = Math.max(0, member.points + (row.kind === "earn" ? points : -points));
    }
    row.status = "done";
    row.lastError = "";
  }
  return changed;
}

// ---------- Reports ----------

// ---------- Commands ----------

type Ctx = { state: PosState; actor: Actor; now: number };
type Command = { roles: Role[] | "public"; run: (ctx: Ctx, args: never) => unknown };

function command<A>(roles: Role[] | "public", run: (ctx: Ctx, args: A) => unknown): Command {
  return { roles, run: run as Command["run"] };
}

const QR_NIRO_PENDING_MS = 15 * 60_000;

// Niro's real sign-in code check is not connected yet. Until it is, the fixed demo code works only while
// demo mode is on, so a live shop can never accept "123456" from anyone who has read the source.
function requireNiroCode(state: PosState, otp: unknown) {
  if (!state.settings.demoMode) fail("Niro sign-in is not switched on yet.", "niro_unavailable");
  if (text(otp) !== DEMO_NIRO_OTP) fail("That code is not right");
}

// The outlet's code in customer ordering addresses: /api/orders/{outlet-code}/{table-code}.
// It is the Niro outlet code when one is set, otherwise "main".
export const outletCode = (state: PosState) => state.settings.niroOutletCode.trim().toLowerCase() || "main";

// A guest may only touch payments on the bill of their own table.
function ownPayment(state: PosState, token: string, paymentId: string) {
  const table = tableByToken(state, token);
  const payment = state.payments.find((row) => row.id === paymentId) ?? fail("Payment not found");
  const bill = state.bills.find((row) => row.id === payment.billId);
  if (!bill || state.checks.find((row) => row.id === bill.checkId)?.tableId !== table.id) fail("Payment not found");
  return payment;
}

// What the customer can pay right now: new items to bill, or a bill already issued and unpaid.
export function qrPayState(state: PosState, check: Check) {
  const billable = check.lines.some((line) => lineCounts(line) && !line.billId && line.status !== "held");
  const unpaid = state.bills.some((bill) => bill.checkId === check.id && bill.status === "issued" && !bill.paid);
  return { available: state.settings.demoMode && !check.qrPending && (billable || unpaid), billable };
}

const tableByToken = (state: PosState, token: unknown) =>
  state.tables.find((table) => table.active && table.qrToken === text(token)) ?? fail("This table QR is not valid", "bad_qr");

const openCheckAtTable = (state: PosState, tableId: string) =>
  state.checks.find((check) => check.open && check.tableId === tableId);

const COMMANDS: Record<string, Command> = {
  // ----- Ordering -----
  send_items: command(
    ALL_FLOOR,
    ({ state, actor, now }, args: { checkId?: string; tableId?: string | null; channel?: "dine_in" | "takeaway"; covers?: number; items: CartItem[] }) => {
      if (!Array.isArray(args.items) || args.items.length === 0) fail("Add at least one item");
      const check = args.checkId
        ? openCheck(state, args.checkId)
        : newCheck(state, actor, now, args.tableId ?? null, args.channel ?? (args.tableId ? "dine_in" : "takeaway"), args.covers ?? 1);
      const toFire: Line[] = [];
      for (const cart of args.items) {
        const line = buildLine(state, check, cart, now);
        check.lines.push(line);
        if (!cart.hold) toFire.push(line);
      }
      fireLines(state, check, toFire, actor, now);
      return { checkId: check.id };
    },
  ),
  fire_held: command(ALL_FLOOR, ({ state, actor, now }, args: { checkId: string; lineIds?: string[] }) => {
    const check = openCheck(state, args.checkId);
    const held = check.lines.filter((line) => line.status === "held" && (!args.lineIds || args.lineIds.includes(line.id)));
    if (held.length === 0) fail("Nothing is on hold");
    fireLines(state, check, held, actor, now);
  }),
  remove_unsent: command(ALL_FLOOR, ({ state, now }, args: { lineId: string }) => {
    const { check, line } = findLine(state, args.lineId);
    if (line.status !== "held") fail("This item is already with the kitchen. Void it instead.");
    check.lines = check.lines.filter((row) => row.id !== line.id);
    if (check.lines.length === 0) {
      check.open = false;
      check.closedAt = now;
    }
  }),
  request_bill: command(ALL_FLOOR, ({ state }, args: { checkId: string }) => {
    openCheck(state, args.checkId).billRequested = true;
  }),
  clear_waiter_call: command(ALL_FLOOR, ({ state }, args: { checkId: string }) => {
    openCheck(state, args.checkId).waiterCalled = false;
  }),
  serve_check: command(ALL_FLOOR, ({ state, now }, args: { checkId: string; lineId?: string }) => {
    const check = openCheck(state, args.checkId);
    const ready = check.lines.filter((line) => line.status === "ready" && (!args.lineId || line.id === args.lineId));
    if (ready.length === 0) fail("Nothing is ready to serve");
    for (const line of ready) line.status = "served";
    maybeClose(state, check, now);
  }),
  move_check: command(ALL_FLOOR, ({ state, now }, args: { checkId: string; toTableId: string; merge?: boolean }) => {
    const check = openCheck(state, args.checkId);
    const table = state.tables.find((row) => row.id === args.toTableId && row.active) ?? fail("Table not found");
    if (check.tableId === table.id) fail("The check is already on that table");
    const from = tableLabel(state, check);
    const target = openCheckAtTable(state, table.id);
    if (!target) {
      check.tableId = table.id;
      check.channel = check.channel === "takeaway" ? "dine_in" : check.channel;
      for (const kot of state.kots.filter((row) => row.checkId === check.id && !row.readyAt)) {
        kot.alert = `Moved from ${from} to ${table.label}`;
      }
      return;
    }
    if (!args.merge) fail(`${table.label} is occupied. Merge the checks instead?`, "table_occupied");
    for (const row of [check, target]) {
      if (state.bills.some((bill) => bill.checkId === row.id && bill.status === "issued")) {
        fail("Cancel the issued bill before merging");
      }
    }
    for (const line of check.lines) line.checkId = target.id;
    target.lines.push(...check.lines);
    target.discountP += check.discountP;
    target.covers += check.covers;
    for (const kot of state.kots.filter((row) => row.checkId === check.id)) {
      kot.checkId = target.id;
      if (!kot.readyAt) kot.alert = `Merged from ${from} into ${table.label}`;
    }
    check.lines = [];
    check.discountP = 0;
    check.open = false;
    check.closedAt = now;
    check.mergedInto = target.id;
  }),
  undo_merge: command(ALL_FLOOR, ({ state }, args: { checkId: string }) => {
    const source = requireCheck(state, args.checkId);
    if (!source.mergedInto) return fail("This check was not merged");
    const target = requireCheck(state, source.mergedInto);
    if (!target.open) fail("The merged check is already closed");
    if (state.bills.some((bill) => bill.checkId === target.id && bill.status === "issued")) fail("Cancel the issued bill first");
    if (source.tableId && openCheckAtTable(state, source.tableId)) fail("The original table is in use now");
    const movedKots = state.kots.filter((kot) => kot.checkId === target.id && kot.originCheckId === source.id);
    const ids = new Set(movedKots.map((kot) => kot.id));
    const moved = target.lines.filter((line) => line.kotId && ids.has(line.kotId));
    if (moved.length === 0) fail("Nothing to move back");
    target.lines = target.lines.filter((line) => !moved.includes(line));
    for (const line of moved) line.checkId = source.id;
    for (const kot of movedKots) {
      kot.checkId = source.id;
      kot.alert = `Unmerged, back to ${tableLabel(state, source)}`;
    }
    source.lines = moved;
    source.open = true;
    source.closedAt = null;
    source.mergedInto = null;
    target.covers = Math.max(1, target.covers - source.covers);
  }),

  // ----- Corrections -----
  void_line: command(ALL_FLOOR, ({ state, actor, now }, args: { lineId: string; approval?: Approvalish }) => {
    const { check, line } = findLine(state, args.lineId);
    if (!check.open) fail("This check is closed");
    if (line.billId) fail("This item is on an issued bill. Cancel the bill first.");
    if (line.status === "void" || line.status === "comp") fail("This item is already corrected");
    if (line.status === "held" || line.status === "awaiting") fail("This item has not gone to the kitchen. Remove it instead.");
    const reason = approve(state, actor, now, "void", "void", args.approval, line.unitP * line.qty, `${check.no}:${line.name}`);
    // Not started: stock goes back. Already started: the food is written off.
    if (line.status === "new") returnStock(state, line, actor, now);
    else line.stock = "wasted";
    touchKotAfterChange(state, line, `Cancelled: ${line.qty} x ${line.name}`);
    line.status = "void";
    line.reason = reason;
    maybeClose(state, check, now);
  }),
  comp_line: command(ALL_FLOOR, ({ state, actor, now }, args: { lineId: string; approval?: Approvalish }) => {
    const { check, line } = findLine(state, args.lineId);
    if (!check.open) fail("This check is closed");
    if (line.billId) fail("This item is on an issued bill. Cancel the bill first.");
    if (line.status === "void" || line.status === "comp") fail("This item is already corrected");
    if (line.status === "held" || line.status === "awaiting") fail("This item has not gone to the kitchen. Remove it instead.");
    line.reason = approve(state, actor, now, "comp", "comp", args.approval, line.unitP * line.qty, `${check.no}:${line.name}`);
    line.status = "comp";
    maybeClose(state, check, now);
  }),
  set_discount: command(TILL, ({ state, actor, now }, args: { checkId: string; amountP: number; approval?: Approvalish }) => {
    const check = openCheck(state, args.checkId);
    const billable = check.lines.filter((line) => lineCounts(line) && line.status !== "comp" && !line.billId);
    const subtotal = billable.reduce((sum, line) => sum + line.unitP * line.qty, 0);
    if (!Number.isInteger(args.amountP) || args.amountP < 0) fail("Enter a valid discount");
    if (args.amountP > subtotal) fail("The discount is more than the bill");
    if (args.amountP === 0) {
      releaseReward(state, check);
      check.discountP = 0;
      check.discountReason = "";
      check.discountBy = "";
      return;
    }
    const cap = Math.floor((subtotal * state.settings.maxCashierDiscountPct) / 100);
    let reason: string;
    if (actor.role === "cashier" && args.amountP <= cap) {
      reason = requireReason(state, "discount", args.approval?.reason);
      state.approvals.push({
        id: nextId(state, "apr"),
        at: now,
        action: "discount_within_cap",
        requester: actor.name,
        approver: actor.name,
        reason,
        amountP: args.amountP,
        ref: String(check.no),
      });
    } else {
      reason = approve(state, actor, now, "discount", "discount", args.approval, args.amountP, String(check.no));
    }
    releaseReward(state, check);
    check.discountP = args.amountP;
    check.discountReason = reason;
    check.discountBy = actor.name;
  }),

  // ----- Kitchen -----
  bump_kot: command(KITCHEN, ({ state, now }, args: { kotId: string }) => {
    const kot = requireKot(state, args.kotId);
    const lines = linesOfKot(state, kot);
    if (lines.some((line) => line.status === "new")) {
      for (const line of lines) if (line.status === "new") line.status = "preparing";
      kot.acceptedAt = kot.acceptedAt ?? now;
      return;
    }
    if (lines.some((line) => line.status === "preparing")) {
      for (const line of lines) if (line.status === "preparing") line.status = "ready";
      kot.readyAt = now;
      return;
    }
    fail("This ticket is already done");
  }),
  bump_line: command(KITCHEN, ({ state, now }, args: { lineId: string }) => {
    const { line } = findLine(state, args.lineId);
    if (line.status === "new") line.status = "preparing";
    else if (line.status === "preparing") line.status = "ready";
    else fail("This item is already done");
    if (line.kotId) {
      const kot = requireKot(state, line.kotId);
      kot.acceptedAt = kot.acceptedAt ?? now;
      const lines = linesOfKot(state, kot);
      if (lines.every((row) => !["new", "preparing"].includes(row.status))) kot.readyAt = now;
    }
  }),
  recall_kot: command(KITCHEN, ({ state, now }, args: { kotId: string }) => {
    const kot = requireKot(state, args.kotId);
    if (!kot.readyAt || now - kot.readyAt > RECALL_WINDOW_MS) fail("This ticket can no longer be recalled");
    const lines = linesOfKot(state, kot).filter((line) => line.status === "ready");
    if (lines.length === 0) fail("These items have already been served");
    for (const line of lines) line.status = "preparing";
    kot.readyAt = null;
  }),
  ack_kot: command(KITCHEN, ({ state }, args: { kotId: string }) => {
    requireKot(state, args.kotId).alert = "";
  }),
  reprint_kot: command([...new Set<Role>([...KITCHEN, ...ALL_FLOOR])], ({ state }, args: { kotId: string }) => {
    requireKot(state, args.kotId).reprints += 1;
  }),
  set_availability: command(KITCHEN, ({ state, now }, args: { itemId?: string; modifierId?: string; mode: "available" | "day" | "indefinite" | "hours"; hours?: number; ignoreStock?: boolean }) => {
    if (args.modifierId) {
      const modifier = state.modifiers.find((row) => row.id === args.modifierId) ?? fail("Option not found");
      modifier.available = args.mode === "available";
      return;
    }
    if (!["available", "day", "indefinite", "hours"].includes(args.mode)) fail("Choose on, off for today, off until switched on, or off for some hours");
    const item = state.items.find((row) => row.id === args.itemId) ?? fail("Item not found");
    if (args.mode === "available") {
      item.soldOut = "none";
      item.soldOutUntil = null;
      if (args.ignoreStock !== undefined) item.ignoreStock = args.ignoreStock;
    } else if (args.mode === "hours") {
      if (!args.hours || args.hours <= 0) return fail("Choose how many hours");
      item.soldOut = "until";
      item.soldOutUntil = now + args.hours * 60 * 60 * 1000;
    } else {
      item.soldOut = args.mode;
      item.soldOutUntil = null;
    }
  }),

  // ----- Billing -----
  issue_bills: command(CHECKOUT, ({ state, actor, now }, args: IssueArgs) => ({ billIds: issueBills(state, actor, now, args) })),
  reprint_bill: command(CHECKOUT, ({ state }, args: { billId: string }) => {
    requireBill(state, args.billId).reprints += 1;
  }),
  cancel_bill: command(TILL, ({ state, actor, now }, args: { billId: string; approval?: Approvalish }) => {
    const bill = requireBill(state, args.billId);
    if (bill.status !== "issued") fail("This bill is already cancelled");
    if (bill.docType === "credit_note") fail("A credit note cannot be cancelled");
    if (state.payments.some((payment) => payment.billId === bill.id && ["confirmed", "pending"].includes(payment.status))) {
      fail("This bill has payments. Use a credit note instead.");
    }
    if (bill.businessDate !== state.businessDate) fail("Bills from a closed day need a credit note");
    bill.statusReason = approve(state, actor, now, "cancel_bill", "cancel", args.approval, bill.totalP, bill.no);
    bill.status = "cancelled";
    const check = requireCheck(state, bill.checkId);
    // The number stays used and visible. Shares from the same even split go together.
    const related = state.bills.filter((row) => row.checkId === check.id && row.status === "issued" && row.shareLabel.startsWith("Share") && bill.shareLabel.startsWith("Share") && row.at === bill.at);
    for (const row of related) {
      if (state.payments.some((payment) => payment.billId === row.id && payment.status === "confirmed")) {
        fail("Another share is already paid. Use a credit note instead.");
      }
      row.status = "cancelled";
      row.statusReason = bill.statusReason;
    }
    for (const line of check.lines) {
      if (line.billId === bill.id) line.billId = null;
    }
    check.discountP += bill.discountP + related.reduce((sum, row) => sum + row.discountP, 0);
    check.discountReason = check.discountP > 0 ? bill.discountReason : "";
    check.open = true;
    check.closedAt = null;
  }),
  credit_note: command(TILL, ({ state, actor, now }, args: { billId: string; refundMethod: "cash" | "upi" | "card"; approval?: Approvalish }) => {
    const bill = requireBill(state, args.billId);
    if (bill.status !== "issued" || bill.docType === "credit_note") fail("Only an issued bill can get a credit note");
    if (!bill.paid) fail("This bill is unpaid. Cancel it instead.");
    const reason = approve(state, actor, now, "credit_note", "credit", args.approval, bill.totalP, bill.no);
    const { fy, no } = nextSerial(state, "credit_note", state.businessDate);
    const note: Bill = {
      ...structuredClone(bill),
      id: nextId(state, "bill"),
      no,
      docType: "credit_note",
      fy,
      businessDate: state.businessDate,
      at: now,
      issuedBy: actor.name,
      originalId: bill.id,
      statusReason: reason,
      reprints: 0,
    };
    state.bills.push(note);
    bill.status = "credited";
    bill.statusReason = reason;
    const paid = state.payments.filter((payment) => payment.billId === bill.id && payment.status === "confirmed");
    for (const payment of paid) payment.status = "refunded";
    if (args.refundMethod === "cash") requireShift(state, actor, now);
    newPayment(state, actor, now, {
      billId: note.id,
      method: args.refundMethod,
      amountP: bill.totalP,
      status: "refunded",
      reason,
    });
    const check = requireCheck(state, bill.checkId);
    if (check.niroMemberId) {
      state.niroOutbox.push({
        id: nextId(state, "nx"),
        kind: "reverse",
        memberId: check.niroMemberId,
        amountP: bill.totalP,
        orderRef: bill.no,
        status: "pending",
        attempts: 0,
        lastError: "",
        at: now,
      });
    }
    return { creditNoteId: note.id };
  }),

  // ----- Payments -----
  pay_cash: command(CHECKOUT, ({ state, actor, now }, args: { billId: string; amountP: number; tenderedP: number; key?: string }) => {
    const existing = existingByKey(state, args.key);
    if (existing) return { paymentId: existing.id, changeP: existing.changeP };
    requireShift(state, actor, now);
    const amountP = positive(args.amountP, "Amount");
    const bill = payableBill(state, args.billId, amountP);
    const tenderedP = positive(args.tenderedP, "Cash received");
    if (tenderedP < amountP) fail("Cash received is less than the amount");
    const payment = newPayment(state, actor, now, {
      billId: bill.id,
      method: "cash",
      amountP,
      tenderedP,
      changeP: tenderedP - amountP,
      key: text(args.key),
    });
    afterConfirmed(state, bill, now);
    return { paymentId: payment.id, changeP: payment.changeP };
  }),
  pay_card: command(CHECKOUT, ({ state, actor, now }, args: { billId: string; amountP: number; ref?: string; key?: string }) => {
    const existing = existingByKey(state, args.key);
    if (existing) return { paymentId: existing.id };
    requireShift(state, actor, now);
    const amountP = positive(args.amountP, "Amount");
    const bill = payableBill(state, args.billId, amountP);
    const payment = newPayment(state, actor, now, {
      billId: bill.id,
      method: "card",
      amountP,
      ref: text(args.ref),
      key: text(args.key),
    });
    afterConfirmed(state, bill, now);
    return { paymentId: payment.id };
  }),
  upi_create: command(CHECKOUT, ({ state, actor, now }, args: { billId: string; amountP: number; key?: string }) => {
    const existing = existingByKey(state, args.key);
    if (existing) return { paymentId: existing.id };
    requireShift(state, actor, now);
    const amountP = positive(args.amountP, "Amount");
    const bill = payableBill(state, args.billId, amountP);
    if (state.payments.some((payment) => payment.billId === bill.id && payment.status === "pending")) {
      fail("A QR is already waiting on this bill. Close it first.");
    }
    const payment = newPayment(state, actor, now, {
      billId: bill.id,
      method: "upi",
      amountP,
      status: "pending",
      provider: "simulated",
      verified: false,
      key: text(args.key),
      expiresAt: now + UPI_QR_MS,
    });
    return { paymentId: payment.id };
  }),
  upi_close: command(CHECKOUT, ({ state }, args: { paymentId: string }) => {
    const payment = state.payments.find((row) => row.id === args.paymentId) ?? fail("Payment not found");
    if (payment.status !== "pending") fail("This QR is no longer waiting");
    payment.status = "closed";
  }),
  // Stands in for the provider webhook. Replace with a verified webhook route when a provider is chosen.
  upi_provider_event: command(CHECKOUT, ({ state, now }, args: { paymentId: string; event: "success" | "failure"; rrn?: string }) => {
    applyProviderEvent(state, args.paymentId, args.event, args.rrn, now);
  }),
  upi_mark_received: command(CHECKOUT, ({ state, actor, now }, args: { billId: string; amountP: number; reason: string; ref?: string; key?: string }) => {
    const existing = existingByKey(state, args.key);
    if (existing) return { paymentId: existing.id };
    requireShift(state, actor, now);
    const amountP = positive(args.amountP, "Amount");
    const bill = payableBill(state, args.billId, amountP);
    const reason = requireReason(state, "upi_override", args.reason);
    const payment = newPayment(state, actor, now, {
      billId: bill.id,
      method: "upi",
      amountP,
      provider: "static_qr",
      verified: false,
      reason,
      ref: text(args.ref),
      key: text(args.key),
    });
    afterConfirmed(state, bill, now);
    return { paymentId: payment.id };
  }),
  upi_verify: command(MGMT, ({ state }, args: { paymentId: string; ref?: string }) => {
    const payment = state.payments.find((row) => row.id === args.paymentId) ?? fail("Payment not found");
    if (payment.method !== "upi" || payment.verified) fail("This payment does not need checking");
    if (payment.status !== "confirmed") fail("Only a recorded payment can be matched");
    payment.verified = true;
    if (args.ref) payment.ref = text(args.ref);
  }),
  upi_resolve_unmatched: command(MGMT, ({ state }, args: { paymentId: string }) => {
    const payment = state.payments.find((row) => row.id === args.paymentId) ?? fail("Payment not found");
    if (payment.status !== "unmatched") fail("This credit is not waiting");
    payment.status = "refunded";
  }),

  // ----- Shifts and close -----
  open_shift: command(TILL, ({ state, actor, now }, args: { floatP: number }) => {
    if (activeShift(state, actor)) fail("You already have an open shift");
    if (!Number.isInteger(args.floatP) || args.floatP < 0) fail("Enter a valid opening float");
    state.shifts.push({
      id: nextId(state, "sh"),
      staffId: actor.staffId ?? "",
      staffName: actor.name,
      openedAt: now,
      closedAt: null,
      floatP: args.floatP,
      moves: [],
      expectedP: null,
      countedP: null,
      varianceP: null,
      note: "",
      approvedBy: "",
      businessDate: state.businessDate,
    });
  }),
  cash_move: command(TILL, ({ state, actor, now }, args: { kind: "in" | "out"; amountP: number; reason: string }) => {
    const shift = requireShift(state, actor, now);
    const reason = text(args.reason);
    if (!reason) fail("Say what the cash was for");
    shift.moves.push({ id: nextId(state, "cm"), at: now, kind: args.kind === "in" ? "in" : "out", amountP: positive(args.amountP, "Amount"), reason });
  }),
  close_shift: command(CHECKOUT, ({ state, actor, now }, args: { shiftId?: string; countedP: number; note?: string; approval?: Approvalish }) => {
    const shift = args.shiftId
      ? (state.shifts.find((row) => row.id === args.shiftId && !row.closedAt) ?? fail("That shift is not open"))
      : requireShift(state, actor, now);
    if (shift.staffId !== actor.staffId && (actor.role === "cashier" || actor.role === "captain")) fail("Only a manager can close someone else's shift");
    if (!Number.isInteger(args.countedP) || args.countedP < 0) fail("Enter the cash you counted");
    const pendingUpi = state.payments.some((payment) => payment.shiftId === shift.id && payment.status === "pending");
    if (pendingUpi) fail("A UPI payment on this shift is still waiting");
    const expectedP = shiftExpectedCash(state, shift);
    const varianceP = args.countedP - expectedP;
    if (Math.abs(varianceP) > state.settings.varianceThresholdP) {
      const approval = args.approval ?? { reason: "" };
      if (!text(approval.reason)) fail(`Counted cash is off by more than the limit. Manager approval needed.`, "variance_approval");
      if (actor.role !== "manager" && actor.role !== "admin") {
        const pin = text(approval.pin);
        if (!pin) fail("Manager PIN needed", "pin_required");
        const approver = state.staff.find((row) => row.active && (row.role === "manager" || row.role === "admin") && verifyPin(row.pinHash, pin));
        if (!approver) throw new PosError("Wrong PIN", "pin_wrong");
        shift.approvedBy = approver.name;
      } else {
        shift.approvedBy = actor.name;
      }
      state.approvals.push({ id: nextId(state, "apr"), at: now, action: "shift_variance", requester: shift.staffName, approver: shift.approvedBy, reason: text(approval.reason), amountP: varianceP, ref: shift.id });
    }
    shift.expectedP = expectedP;
    shift.countedP = args.countedP;
    shift.varianceP = varianceP;
    shift.closedAt = now;
    shift.note = text(args.note);
    return { expectedP, varianceP };
  }),
  day_close: command(MGMT, ({ state, actor, now }) => {
    const problems = dayCloseProblems(state);
    if (problems.length > 0) fail(`Finish first: ${problems.join(", ")}`, "day_close_blocked");
    const report = dayReport(state, state.businessDate);
    state.dayCloses.push({ businessDate: state.businessDate, closedAt: now, closedBy: actor.name, report });
    for (const item of state.items) {
      if (item.soldOut === "day") item.soldOut = "none";
    }
    const today = istDate(now);
    state.businessDate = today > state.businessDate ? today : nextDate(state.businessDate);
    return { report };
  }),

  // ----- Clock and roster -----
  clock_in: command(EVERYONE, ({ state, actor, now }) => {
    if (state.clock.some((row) => row.staffId === actor.staffId && !row.outAt)) fail("You are already clocked in");
    state.clock.push({ id: nextId(state, "clk"), staffId: actor.staffId ?? "", staffName: actor.name, businessDate: state.businessDate, inAt: now, outAt: null });
  }),
  clock_out: command(EVERYONE, ({ state, actor, now }) => {
    const row = state.clock.find((entry) => entry.staffId === actor.staffId && !entry.outAt) ?? fail("You are not clocked in");
    if (activeShift(state, actor)) fail("Close and count your cash first");
    row.outAt = now;
  }),
  roster_upsert: command(MGMT, ({ state }, args: { id?: string; staffId: string; date: string; start: string; end: string; section?: string }) => {
    const staff = state.staff.find((row) => row.id === args.staffId && row.active) ?? fail("Choose a staff member");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text(args.date))) fail("Choose a date");
    if (!/^\d{2}:\d{2}$/.test(text(args.start)) || !/^\d{2}:\d{2}$/.test(text(args.end))) fail("Enter start and end times");
    const fields = { staffId: staff.id, staffName: staff.name, date: args.date, start: args.start, end: args.end, section: text(args.section) };
    const row = state.roster.find((entry) => entry.id === args.id);
    if (row) Object.assign(row, fields);
    else state.roster.push({ id: nextId(state, "ros"), ...fields });
  }),
  roster_delete: command(MGMT, ({ state }, args: { id: string }) => {
    state.roster = state.roster.filter((row) => row.id !== args.id);
  }),

  // ----- Stock -----
  stock_move: command(MGMT, ({ state, actor, now }, args: { ingredientId: string; kind: "receive" | "adjust" | "waste"; qty: number; reason: string }) => {
    const ingredient = state.ingredients.find((row) => row.id === args.ingredientId) ?? fail("Ingredient not found");
    const reason = text(args.reason);
    if (!reason) fail("Enter a reason");
    if (typeof args.qty !== "number" || !Number.isFinite(args.qty) || args.qty === 0) fail("Enter a quantity");
    let delta = roundQty(args.qty);
    if (args.kind === "receive" || args.kind === "waste") {
      if (delta < 0) fail("Enter a positive quantity");
      if (args.kind === "waste") delta = -delta;
    } else if (args.kind !== "adjust") {
      fail("Unknown stock entry");
    }
    if (ingredient.stock + delta < 0) fail("That would take stock below zero");
    ingredient.stock = roundQty(ingredient.stock + delta);
    state.stockMoves.push({ id: nextId(state, "mv"), at: now, ingredientId: ingredient.id, delta, kind: args.kind, ref: "", actor: actor.name, reason });
  }),

  // ----- Admin (tax, price and setup are admin-only) -----
  update_settings: command(ADMIN, ({ state }, args: { patch: Partial<PosState["settings"]> }) => {
    const raw = (args.patch ?? {}) as Record<string, unknown>;
    const patch: Partial<PosState["settings"]> = {};
    // Only known settings, each with the right kind of value. Anything else is ignored, never stored.
    for (const [key, kind] of SETTING_KINDS) {
      if (!(key in raw)) continue;
      const value = raw[key];
      if (kind === "text") {
        if (typeof value !== "string") fail("Check the settings and try again");
        (patch as Record<string, unknown>)[key] = (value as string).trim().slice(0, 200);
      } else if (kind === "bool") {
        if (typeof value !== "boolean") fail("Check the settings and try again");
        (patch as Record<string, unknown>)[key] = value;
      } else {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail("Check the settings and try again");
        (patch as Record<string, unknown>)[key] = value;
      }
    }
    if (patch.taxMode !== undefined && !["regular", "composition"].includes(patch.taxMode)) fail("Choose a tax mode");
    if (patch.qrMode !== undefined && !["accept_first", "auto"].includes(patch.qrMode)) fail("Choose how QR orders are handled");
    if (patch.gstin && !GSTIN_PATTERN.test(patch.gstin.toUpperCase())) fail("That GSTIN does not look valid");
    if (patch.fssai && !/^[0-9]{14}$/.test(patch.fssai)) fail("The FSSAI number must have 14 digits");
    if (patch.maxCashierDiscountPct !== undefined && patch.maxCashierDiscountPct > 100) fail("Discount limit must be 0 to 100");
    if (patch.niroOutletCode && !/^[a-z0-9][a-z0-9-]{0,39}$/i.test(patch.niroOutletCode)) fail("The outlet code can only use letters, numbers and dashes");
    for (const key of ["varianceThresholdP", "niroPointsPer100"] as const) {
      if (patch[key] !== undefined && !Number.isInteger(patch[key])) fail("Check the settings and try again");
    }
    if (patch.taxMode && patch.taxMode !== state.settings.taxMode) {
      const fy = financialYear(state.businessDate);
      if (state.bills.some((bill) => bill.fy === fy)) fail("Tax mode is fixed once this financial year has bills");
    }
    state.settings = { ...state.settings, ...patch, gstin: (patch.gstin ?? state.settings.gstin).toUpperCase() };
  }),
  upsert_category: command(ADMIN, ({ state }, args: { id?: string; name: string; sort?: number }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    const row = state.categories.find((entry) => entry.id === args.id);
    if (row) {
      row.name = name;
      row.sort = args.sort ?? row.sort;
    } else state.categories.push({ id: nextId(state, "cat"), name, sort: args.sort ?? state.categories.length + 1 });
  }),
  delete_category: command(ADMIN, ({ state }, args: { id: string }) => {
    if (state.items.some((item) => item.categoryId === args.id && item.active)) fail("Move or remove its items first");
    state.categories = state.categories.filter((row) => row.id !== args.id);
  }),
  upsert_item: command(ADMIN, ({ state }, args: { id?: string; name: string; categoryId: string; priceP: number; veg: boolean; stationId: string; taxClassId: string; active?: boolean }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    if (!Number.isInteger(args.priceP) || args.priceP < 0) fail("Enter a valid price");
    if (!state.categories.some((row) => row.id === args.categoryId)) fail("Choose a category");
    if (!state.stations.some((row) => row.id === args.stationId)) fail("Choose a station");
    if (!state.taxClasses.some((row) => row.id === args.taxClassId)) fail("Choose a tax class");
    const row = state.items.find((entry) => entry.id === args.id);
    const fields = { name, categoryId: args.categoryId, priceP: args.priceP, veg: !!args.veg, stationId: args.stationId, taxClassId: args.taxClassId, active: args.active ?? true };
    if (row) Object.assign(row, fields);
    else state.items.push({ id: nextId(state, "itm"), ...fields, soldOut: "none", soldOutUntil: null, ignoreStock: false });
  }),
  upsert_modifier_group: command(ADMIN, ({ state }, args: { id?: string; itemId: string; name: string; min: number; max: number }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    if (args.min < 0 || args.max < 1 || args.min > args.max) fail("Check the minimum and maximum");
    const row = state.modifierGroups.find((entry) => entry.id === args.id);
    if (row) Object.assign(row, { name, min: args.min, max: args.max });
    else state.modifierGroups.push({ id: nextId(state, "grp"), itemId: args.itemId, name, min: args.min, max: args.max });
  }),
  delete_modifier_group: command(ADMIN, ({ state }, args: { id: string }) => {
    const ids = state.modifiers.filter((row) => row.groupId === args.id).map((row) => row.id);
    state.modifiers = state.modifiers.filter((row) => row.groupId !== args.id);
    state.recipes = state.recipes.filter((row) => !ids.includes(row.ownerId));
    state.modifierGroups = state.modifierGroups.filter((row) => row.id !== args.id);
  }),
  upsert_modifier: command(ADMIN, ({ state }, args: { id?: string; groupId: string; name: string; priceP: number }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    if (!Number.isInteger(args.priceP) || args.priceP < 0) fail("Enter a valid price");
    const row = state.modifiers.find((entry) => entry.id === args.id);
    if (row) Object.assign(row, { name, priceP: args.priceP });
    else state.modifiers.push({ id: nextId(state, "mod"), groupId: args.groupId, name, priceP: args.priceP, available: true });
  }),
  delete_modifier: command(ADMIN, ({ state }, args: { id: string }) => {
    state.modifiers = state.modifiers.filter((row) => row.id !== args.id);
    state.recipes = state.recipes.filter((row) => row.ownerId !== args.id);
  }),
  set_recipe: command(ADMIN, ({ state }, args: { ownerId: string; ingredientId: string; qty: number }) => {
    state.recipes = state.recipes.filter((row) => !(row.ownerId === args.ownerId && row.ingredientId === args.ingredientId));
    if (args.qty > 0) state.recipes.push({ ownerId: args.ownerId, ingredientId: args.ingredientId, qty: args.qty });
  }),
  upsert_ingredient: command(ADMIN, ({ state }, args: { id?: string; name: string; unit: string; lowAt: number }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    const row = state.ingredients.find((entry) => entry.id === args.id);
    if (row) Object.assign(row, { name, unit: text(args.unit) || row.unit, lowAt: Math.max(0, args.lowAt || 0) });
    else state.ingredients.push({ id: nextId(state, "ing"), name, unit: text(args.unit) || "pc", stock: 0, lowAt: Math.max(0, args.lowAt || 0) });
  }),
  upsert_staff: command(ADMIN, ({ state }, args: { id?: string; name: string; phone?: string; role: Role; active?: boolean; pin?: string; canSettle?: boolean }) => {
    const name = text(args.name);
    if (!name) fail("Enter a name");
    if (!ROLES.includes(args.role)) fail("Choose a role");
    const phone = args.phone === undefined ? undefined : normalizePhone(args.phone);
    if (phone !== undefined && !isMobileNumber(phone)) fail("Enter a 10-digit mobile number");
    if (phone && state.staff.some((entry) => entry.phone === phone && entry.id !== args.id)) fail("That phone number belongs to someone else");
    const pin = text(args.pin);
    if (pin && !/^[0-9]{4,6}$/.test(pin)) fail("The PIN must be 4 to 6 digits");
    const row = state.staff.find((entry) => entry.id === args.id);
    if (row) {
      Object.assign(row, { name, role: args.role, active: args.active ?? row.active, canSettle: args.canSettle ?? row.canSettle });
      if (phone) row.phone = phone;
      if (pin) row.pinHash = hashPin(pin);
    } else {
      if (!phone) fail("Enter a phone number for new staff");
      if (!pin) fail("Set a PIN for new staff");
      state.staff.push({ id: nextId(state, "st"), name, phone: phone ?? "", role: args.role, active: true, canSettle: !!args.canSettle, pinHash: hashPin(pin) });
    }
    // The owner must never be able to lock everyone out, including by changing their own role.
    if (!state.staff.some((entry) => entry.active && entry.role === "admin")) fail("There must always be one active owner");
  }),
  upsert_table: command(ADMIN, ({ state }, args: { id?: string; label: string; active?: boolean }) => {
    const label = text(args.label);
    if (!label) fail("Enter a table name");
    const row = state.tables.find((entry) => entry.id === args.id);
    if (state.tables.some((entry) => entry.label === label && entry.id !== args.id)) fail("That table name is in use");
    if (row) {
      if (args.active === false && openCheckAtTable(state, row.id)) fail("This table has an open check");
      Object.assign(row, { label, active: args.active ?? row.active });
    } else {
      const id = nextId(state, "tb");
      state.tables.push({ id, label, active: true, qrToken: randomToken() });
    }
  }),
  rotate_table_qr: command(ADMIN, ({ state, now }, args: { id: string }) => {
    const row = state.tables.find((entry) => entry.id === args.id) ?? fail("Table not found");
    row.qrToken = randomToken();
  }),
  set_niro_down: command(ADMIN, ({ state }, args: { down: boolean }) => {
    state.niroDown = !!args.down;
  }),

  niro_test: command(ADMIN, ({ state }) => ({ ok: !state.niroDown, outletCode: state.settings.niroOutletCode })),
  upsert_reward: command(ADMIN, ({ state }, args: { id?: string; name: string; discountP: number; cost: number }) => {
    const name = text(args.name);
    if (!name) fail("Enter a reward name");
    if (!Number.isInteger(args.discountP) || args.discountP <= 0) fail("Enter the discount in rupees");
    if (!Number.isInteger(args.cost) || args.cost <= 0) fail("Enter the points it costs");
    const row = state.niroRewards.find((entry) => entry.id === args.id);
    if (row) Object.assign(row, { name, discountP: args.discountP, cost: args.cost });
    else state.niroRewards.push({ id: nextId(state, "rwd"), name, discountP: args.discountP, cost: args.cost });
  }),
  delete_reward: command(ADMIN, ({ state }, args: { id: string }) => {
    state.niroRewards = state.niroRewards.filter((entry) => entry.id !== args.id);
  }),

  // ----- Niro at the till -----
  niro_lookup: command(TILL, ({ state }, args: { phone: string }) => {
    const member = state.niroMembers.find((row) => row.phone === text(args.phone));
    if (!member) return { member: null, rewards: [] };
    return {
      member: { id: member.id, name: member.name, points: member.points, phone: maskPhone(member.phone) },
      rewards: state.niroRewards.filter((reward) => reward.cost <= member.points),
    };
  }),
  niro_attach: command(TILL, ({ state }, args: { checkId: string; memberId: string }) => {
    const check = openCheck(state, args.checkId);
    if (!state.niroMembers.some((row) => row.id === args.memberId)) fail("Member not found");
    check.niroMemberId = args.memberId;
  }),
  niro_redeem: command(TILL, ({ state, actor }, args: { checkId: string; rewardId: string; otp: string }) => {
    const check = openCheck(state, args.checkId);
    if (!check.niroMemberId) fail("Attach a Niro member first");
    requireNiroCode(state, args.otp);
    if (check.niroRewardId && check.discountP > 0) fail("A reward is already applied. Remove the discount before using another.", "reward_applied");
    const reward = state.niroRewards.find((row) => row.id === args.rewardId) ?? fail("Reward not found");
    const member = state.niroMembers.find((row) => row.id === check.niroMemberId) ?? fail("Member not found");
    if (member.points < reward.cost) fail("Not enough points");
    const subtotal = check.lines.filter((line) => lineCounts(line) && line.status !== "comp" && !line.billId).reduce((sum, line) => sum + line.unitP * line.qty, 0);
    member.points -= reward.cost;
    check.discountP = Math.min(reward.discountP, subtotal);
    check.discountReason = `Niro: ${reward.name}`;
    check.discountBy = actor.name;
    check.niroRewardId = reward.id;
    check.niroRewardCost = reward.cost;
    check.niroRewardRef = `mock_${check.no}_${reward.id}`;
  }),

  // ----- QR staff gate -----
  qr_accept: command(ALL_FLOOR, ({ state, actor, now }, args: { checkId: string }) => {
    const check = openCheck(state, args.checkId);
    if (!check.qrPending) fail("This order does not need accepting");
    check.qrPending = false;
    fireLines(state, check, check.lines.filter((line) => line.status === "awaiting"), actor, now);
    check.captain = check.captain || (actor.role === "captain" ? actor.name : "");
  }),
  qr_reject: command(ALL_FLOOR, ({ state, now }, args: { checkId: string; reason: string }) => {
    const check = openCheck(state, args.checkId);
    if (!check.qrPending) fail("This order does not need accepting");
    if (!text(args.reason)) fail("Say why the order is being rejected");
    check.cancelledReason = text(args.reason);
    for (const line of check.lines.filter((row) => row.status === "awaiting")) {
      line.status = "void";
      line.reason = check.cancelledReason;
    }
    check.qrPending = false;
    check.open = false;
    check.closedAt = now;
  }),

  // ----- Customer (public, bound to a table QR token) -----
  qr_place: command("public", ({ state, actor, now }, args: { token: string; items: CartItem[] }) => {
    const table = tableByToken(state, args.token);
    if (!Array.isArray(args.items) || args.items.length === 0) fail("Add at least one item");
    let check = openCheckAtTable(state, table.id);
    const first = !check;
    check = check ?? newCheck(state, actor, now, table.id, "qr", 1);
    const pending = state.qrNiroPending?.[table.id];
    if (pending) {
      if (pending.until > now && !check.niroMemberId) check.niroMemberId = pending.memberId;
      delete state.qrNiroPending![table.id];
    }
    const gated = state.settings.qrMode === "accept_first" && (first || check.qrPending);
    const lines = args.items.map((cart) => buildLine(state, check, { ...cart, hold: false }, now));
    check.lines.push(...lines);
    if (gated) {
      for (const line of lines) line.status = "awaiting";
      check.qrPending = true;
    } else {
      fireLines(state, check, lines, actor, now);
    }
    return { checkId: check.id };
  }),
  // Customer pays from the table QR. The server issues the bill and fixes the amount; the guest sends no money values.
  qr_pay_start: command("public", ({ state, actor, now }, args: { token: string; key?: string }) => {
    if (!state.settings.demoMode) fail("Online payment is not switched on yet. Please pay at the counter.", "pay_unavailable");
    const table = tableByToken(state, args.token);
    const check = openCheckAtTable(state, table.id) ?? fail("Place an order first");
    const pay = qrPayState(state, check);
    if (!pay.available) fail(check.qrPending ? "Please wait until staff confirm your order." : "There is nothing to pay yet.");
    if (pay.billable) issueBills(state, actor, now, { checkId: check.id, mode: "single" });
    const bill = state.bills.find((row) => row.checkId === check.id && row.status === "issued" && !row.paid) ?? fail("There is nothing to pay yet.");
    const existing = state.payments.find((row) => row.billId === bill.id && row.status === "pending");
    if (existing) return { paymentId: existing.id, billNo: bill.no, amountP: existing.amountP };
    const amountP = billDueP(state, bill);
    const payment = newPayment(state, actor, now, {
      billId: bill.id,
      method: "upi",
      amountP,
      status: "pending",
      provider: "simulated",
      verified: false,
      key: text(args.key),
      expiresAt: now + UPI_QR_MS,
    });
    return { paymentId: payment.id, billNo: bill.no, amountP };
  }),
  qr_pay_event: command("public", ({ state, now }, args: { token: string; paymentId: string; event: "success" | "failure" }) => {
    if (!state.settings.demoMode) fail("Online payment is not switched on yet. Please pay at the counter.", "pay_unavailable");
    ownPayment(state, args.token, args.paymentId);
    applyProviderEvent(state, args.paymentId, args.event === "success" ? "success" : "failure", undefined, now);
  }),
  qr_pay_cancel: command("public", ({ state }, args: { token: string; paymentId: string }) => {
    const payment = ownPayment(state, args.token, args.paymentId);
    if (payment.status === "pending") payment.status = "closed";
  }),
  qr_request_bill: command("public", ({ state }, args: { token: string }) => {
    const check = openCheckAtTable(state, tableByToken(state, args.token).id) ?? fail("There is no open order on this table");
    check.billRequested = true;
  }),
  qr_call_waiter: command("public", ({ state }, args: { token: string }) => {
    const check = openCheckAtTable(state, tableByToken(state, args.token).id) ?? fail("Place an order first, or wave to a captain");
    check.waiterCalled = true;
  }),
  // The member is verified here on the server after OTP. A client-supplied member ID is never trusted.
  qr_niro_signin: command("public", ({ state, now }, args: { token: string; phone: string; otp: string; loyalty: boolean; offers: boolean }) => {
    const table = tableByToken(state, args.token);
    requireNiroCode(state, args.otp);
    const member = state.niroMembers.find((row) => row.phone === text(args.phone)) ?? fail("No Niro member with that phone");
    if (!args.loyalty) fail("Tick loyalty to earn points on this order");
    const add = (purpose: "loyalty" | "offers") => {
      state.consents.push({ id: nextId(state, "cns"), memberId: member.id, purpose, noticeVersion: "v1", at: now });
    };
    add("loyalty");
    if (args.offers) add("offers");
    const check = openCheckAtTable(state, table.id);
    if (check) check.niroMemberId = member.id;
    else (state.qrNiroPending ??= {})[table.id] = { memberId: member.id, until: now + QR_NIRO_PENDING_MS };
    return { name: member.name, points: member.points };
  }),
};

const SETTING_KINDS: [keyof PosState["settings"], "text" | "bool" | "number"][] = [
  ["shopName", "text"],
  ["legalName", "text"],
  ["address", "text"],
  ["gstin", "text"],
  ["fssai", "text"],
  ["taxMode", "text"],
  ["pricesInclusive", "bool"],
  ["roundOff", "bool"],
  ["maxCashierDiscountPct", "number"],
  ["varianceThresholdP", "number"],
  ["qrMode", "text"],
  ["niroPointsPer100", "number"],
  ["niroOutletCode", "text"],
  ["demoMode", "bool"],
];

const SETTLE_COMMANDS = new Set(["issue_bills", "reprint_bill", "pay_cash", "pay_card", "upi_create", "upi_close", "upi_provider_event", "upi_mark_received"]);

export function linesOfKot(state: PosState, kot: Kot) {
  const check = state.checks.find((row) => row.id === kot.checkId);
  return check ? check.lines.filter((line) => line.kotId === kot.id) : [];
}

export function shiftExpectedCash(state: PosState, shift: Shift) {
  const cash = state.payments
    .filter((payment) => payment.shiftId === shift.id && payment.method === "cash")
    .reduce((sum, payment) => {
      if (payment.status === "confirmed") return sum + payment.amountP;
      // Paid in, then refunded later: cash in the drawer is unchanged until the refund row below.
      if (payment.status === "refunded" && payment.tenderedP > 0) return sum + payment.amountP;
      if (payment.status === "refunded") return sum - payment.amountP;
      return sum;
    }, 0);
  const moves = shift.moves.reduce((sum, move) => sum + (move.kind === "in" ? move.amountP : -move.amountP), 0);
  return shift.floatP + cash + moves;
}

export function dayCloseProblems(state: PosState) {
  const problems: string[] = [];
  const open = state.checks.filter((check) => check.open).length;
  if (open) problems.push(`${open} open check${open > 1 ? "s" : ""}`);
  const pending = state.payments.filter((payment) => payment.status === "pending").length;
  if (pending) problems.push(`${pending} UPI payment${pending > 1 ? "s" : ""} waiting`);
  const shifts = state.shifts.filter((shift) => !shift.closedAt).length;
  if (shifts) problems.push(`${shifts} open shift${shifts > 1 ? "s" : ""}`);
  return problems;
}

const nextDate = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export const maskPhone = (phone: string) => `${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;

// Removes secrets before the audit log stores a command.
function auditDetail(type: string, args: unknown) {
  const clean = JSON.stringify(args ?? {}, (key, value) => (["pin", "otp", "phone"].includes(key) ? "***" : value));
  return clean.length > 400 ? `${clean.slice(0, 400)}...` : clean;
}

export function dispatch(state: PosState, actor: Actor, type: string, args: unknown, now: number): { state: PosState; result: unknown } {
  const entry = Object.hasOwn(COMMANDS, type) ? COMMANDS[type] : undefined;
  if (!entry) throw new PosError("Unknown action", "unknown_command");
  if (entry.roles === "public") {
    if (actor.role !== null) actor = { role: null, staffId: null, name: "Guest" };
  } else if (!actor.role || !entry.roles.includes(actor.role)) {
    throw new PosError("Your role cannot do this", "forbidden");
  } else if (actor.role === "captain" && SETTLE_COMMANDS.has(type)) {
    const staff = state.staff.find((row) => row.id === actor.staffId);
    if (!staff?.canSettle) throw new PosError("Ask the owner to allow table checkout for you", "settle_not_allowed");
  }

  const draft = structuredClone(state);
  let result: unknown;
  try {
    result = entry.run({ state: draft, actor, now }, (args ?? {}) as never);
  } catch (error) {
    if (error instanceof PosError && error.code === "pin_wrong") {
      // Wrong PINs must count even though the rest of the command is discarded.
      state.pinFails += 1;
      if (state.pinFails >= 5) {
        state.pinLockedUntil = now + 60_000;
        state.pinFails = 0;
      }
    }
    throw error;
  }
  draft.version += 1;
  draft.audit.push({
    id: draft.audit.length + 1,
    at: now,
    actor: actor.name,
    role: actor.role ?? "guest",
    type,
    detail: auditDetail(type, args),
  });
  return { state: draft, result };
}

export function actorFor(state: PosState, role: Role | null): Actor {
  if (!role) return { role: null, staffId: null, name: "Guest" };
  const staff = state.staff.find((row) => row.role === role && row.active);
  return { role, staffId: staff?.id ?? null, name: staff?.name ?? role };
}

export function actorForStaff(state: PosState, staffId: string): Actor | null {
  const staff = state.staff.find((row) => row.id === staffId && row.active);
  return staff ? { role: staff.role, staffId: staff.id, name: staff.name } : null;
}

const LOGIN_LOCK_MS = 60_000;
const DUMMY_PIN_HASH = hashPin("000000", "no-such-person");
const LOGIN_LOG_LIMIT = 1000;

// Checks a phone number and PIN for one app. Every attempt is logged, and repeated failures lock that number briefly.
// The same error covers an unknown number and a wrong PIN, so the page cannot be used to find staff numbers.
// Changes `state` directly so failed attempts are kept. Returns the staff member on success.
export function attemptLogin(state: PosState, phone: string, pin: string, app: AppId | "auth", allowed: readonly Role[], now: number): Staff {
  const key = normalizePhone(phone);
  if (!isMobileNumber(key)) throw new PosError("Enter your 10-digit phone number", "login_failed");
  const staff = state.staff.find((row) => row.active && row.phone === key);
  const log = (ok: boolean, detail: string) => {
    state.logins.push({ id: (state.seq += 1), at: now, staffId: staff?.id ?? "", staffName: staff?.name ?? `Unknown number ending ${key.slice(-4)}`, role: staff?.role ?? null, app, ok, detail });
    if (state.logins.length > LOGIN_LOG_LIMIT) state.logins.splice(0, state.logins.length - LOGIN_LOG_LIMIT);
    state.version += 1;
  };
  const lock = state.loginLocks[key];
  if (lock && lock.until > now) {
    log(false, "locked");
    throw new PosError("Too many wrong attempts. Wait a minute and try again.", "pin_locked");
  }
  // The check runs even for an unknown number, so the time taken does not reveal which numbers are staff.
  const pinOk = verifyPin(staff?.pinHash ?? DUMMY_PIN_HASH, String(pin));
  if (!staff || !pinOk) {
    const fails = (lock?.fails ?? 0) + 1;
    state.loginLocks[key] = fails >= 5 ? { fails: 0, until: now + LOGIN_LOCK_MS } : { fails, until: 0 };
    log(false, staff ? "wrong pin" : "unknown number");
    throw new PosError("Wrong phone number or PIN", "login_failed");
  }
  if (!allowed.includes(staff.role)) {
    log(false, "role not allowed in this app");
    throw new PosError("Your role cannot sign in to this app", "forbidden");
  }
  delete state.loginLocks[key];
  if (isLegacyPinHash(staff.pinHash)) staff.pinHash = hashPin(String(pin));
  log(true, "signed in");
  return staff;
}
