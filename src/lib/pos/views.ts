// What each role may read. Everything sent to a browser passes through here,
// so a role only ever receives its own projection. Mirrors RLS at the Supabase step.
import type { Role } from "../roles/index.ts";
import { billPaidP, dayCloseProblems, itemAvailable, itemSoldOut, linesOfKot, maskPhone, outletCode, qrPayState, shiftExpectedCash, stockBlocked, PosError } from "./engine.ts";
import { priceLines } from "./money.ts";
import { dayReport } from "./report.ts";
import type { Actor, Check, PosState, Staff } from "./types.ts";

export type MenuView = ReturnType<typeof menuView>;
export type FloorView = ReturnType<typeof floorView>;
export type KdsView = ReturnType<typeof kdsView>;
export type TillView = ReturnType<typeof tillView>;
export type ManagerView = ReturnType<typeof managerView>;
export type AdminView = ReturnType<typeof adminView>;
export type TeamView = ReturnType<typeof teamView>;
export type QrView = ReturnType<typeof qrView>;
export type CheckView = ReturnType<typeof checkView>;

export function menuView(state: PosState, now: number) {
  return {
    categories: [...state.categories].sort((a, b) => a.sort - b.sort),
    items: state.items
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        priceP: item.priceP,
        veg: item.veg,
        available: itemAvailable(state, item, now),
        groups: state.modifierGroups
          .filter((group) => group.itemId === item.id)
          .map((group) => ({
            ...group,
            options: state.modifiers
              .filter((modifier) => modifier.groupId === group.id)
              .map(({ id, name, priceP, available }) => ({ id, name, priceP, available })),
          })),
      })),
  };
}

const label = (state: PosState, check: Check) => {
  if (!check.tableId) return check.channel === "takeaway" ? "Takeaway" : "Counter";
  return state.tables.find((table) => table.id === check.tableId)?.label ?? check.tableId;
};

// Running totals are computed here on the server. Clients only display them.
function checkView(state: PosState, check: Check) {
  const bills = state.bills.filter((bill) => bill.checkId === check.id && bill.docType !== "credit_note");
  const unbilled = check.lines.filter((line) => line.status !== "void" && !line.billId && line.status !== "held");
  const preview = priceLines(
    unbilled.map((line) => ({
      lineId: line.id,
      itemId: line.itemId,
      name: line.name,
      mods: line.mods,
      qtyLabel: String(line.qty),
      qtySold: line.qty,
      grossP: line.unitP * line.qty,
      comp: line.status === "comp",
      taxClassId: line.taxClassId,
    })),
    check.discountP,
    state.settings,
    state.taxClasses,
  );
  const member = state.niroMembers.find((row) => row.id === check.niroMemberId);
  return {
    id: check.id,
    no: check.no,
    tableId: check.tableId,
    tableLabel: label(state, check),
    channel: check.channel,
    covers: check.covers,
    open: check.open,
    billRequested: check.billRequested,
    waiterCalled: check.waiterCalled,
    qrPending: check.qrPending,
    captain: check.captain,
    openedAt: check.openedAt,
    mergedInto: check.mergedInto,
    lines: check.lines,
    discountP: check.discountP,
    discountReason: check.discountReason,
    niroMember: member ? { id: member.id, name: member.name, points: member.points, phone: maskPhone(member.phone) } : null,
    preview: { subtotalP: preview.subtotalP, discountP: preview.discountP, taxableP: preview.taxableP, cgstP: preview.cgstP, sgstP: preview.sgstP, roundOffP: preview.roundOffP, totalP: preview.totalP },
    bills: bills.map((bill) => ({ ...bill, paidP: billPaidP(state, bill.id) })),
    payments: state.payments.filter((payment) => bills.some((bill) => bill.id === payment.billId)),
  };
}

export type TableState = "free" | "pending_qr" | "seated" | "kot_sent" | "food_ready" | "bill_requested" | "paid_cooking";

function tableState(state: PosState, check: Check | undefined): TableState {
  if (!check) return "free";
  if (check.qrPending) return "pending_qr";
  const bills = state.bills.filter((bill) => bill.checkId === check.id && bill.status === "issued" && bill.docType !== "credit_note");
  if (bills.length > 0 && bills.every((bill) => bill.paid)) return "paid_cooking";
  if (check.billRequested) return "bill_requested";
  if (check.lines.some((line) => line.status === "ready")) return "food_ready";
  if (check.lines.some((line) => line.status === "new" || line.status === "preparing")) return "kot_sent";
  return "seated";
}

function floorView(state: PosState, now: number) {
  const open = state.checks.filter((check) => check.open);
  return {
    now,
    businessDate: state.businessDate,
    tables: state.tables
      .filter((table) => table.active)
      .map((table) => {
        const check = open.find((row) => row.tableId === table.id);
        return {
          id: table.id,
          label: table.label,
          state: tableState(state, check),
          checkId: check?.id ?? null,
          openedAt: check?.openedAt ?? null,
          itemCount: check?.lines.filter((line) => line.status !== "void").reduce((sum, line) => sum + line.qty, 0) ?? 0,
          amountP: check ? checkView(state, check).preview.totalP : 0,
          captain: check?.captain ?? "",
          waiterCalled: check?.waiterCalled ?? false,
        };
      }),
    checks: open.map((check) => checkView(state, check)),
    undoableMerges: state.checks
      .filter((check) => check.mergedInto && state.checks.find((row) => row.id === check.mergedInto)?.open)
      .map((check) => ({ id: check.id, no: check.no, tableLabel: label(state, check), mergedInto: check.mergedInto })),
    reasons: state.reasonCodes,
    menu: menuView(state, now),
    kitchen: state.kots
      .filter((kot) => linesOfKot(state, kot).some((line) => ["new", "preparing", "ready"].includes(line.status)))
      .map((kot) => kotRow(state, kot.id)),
    stations: state.stations,
  };
}

// No prices: this is also the kitchen's feed.
function kotRow(state: PosState, kotId: string) {
  const kot = state.kots.find((row) => row.id === kotId)!;
  const check = state.checks.find((row) => row.id === kot.checkId);
  return {
    id: kot.id,
    no: kot.no,
    round: kot.round,
    stationId: kot.stationId,
    at: kot.at,
    acceptedAt: kot.acceptedAt,
    readyAt: kot.readyAt,
    alert: kot.alert,
    reprints: kot.reprints,
    checkNo: check?.no ?? 0,
    tableLabel: check ? label(state, check) : "",
    channel: check?.channel ?? "dine_in",
    lines: linesOfKot(state, kot).map((line) => ({
      id: line.id,
      name: line.name,
      qty: line.qty,
      mods: line.mods,
      note: line.note,
      status: line.status,
    })),
  };
}

function kdsView(state: PosState, now: number) {
  return {
    now,
    stations: state.stations,
    tickets: state.kots
      .filter((kot) => {
        const lines = linesOfKot(state, kot);
        const live = lines.some((line) => ["new", "preparing"].includes(line.status));
        return live || kot.alert !== "" || (kot.readyAt !== null && now - kot.readyAt < 5 * 60 * 1000 && lines.some((line) => line.status === "ready"));
      })
      .map((kot) => kotRow(state, kot.id)),
    availability: state.items
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        name: item.name,
        stationId: item.stationId,
        soldOut: item.soldOut,
        soldOutUntil: item.soldOutUntil,
        stockBlocked: stockBlocked(state, item),
        ignoreStock: item.ignoreStock,
        options: state.modifiers
          .filter((modifier) => state.modifierGroups.some((group) => group.id === modifier.groupId && group.itemId === item.id))
          .map(({ id, name, available }) => ({ id, name, available })),
      })),
  };
}

function shiftForTill({ id, staffName, openedAt, floatP, moves, businessDate }: PosState["shifts"][number]) {
  // The expected amount stays on the server until the count is entered.
  return { id, staffName, openedAt, floatP, moves, businessDate };
}

function tillView(state: PosState, actor: Actor, now: number) {
  const shift = state.shifts.find((row) => row.staffId === actor.staffId && !row.closedAt);
  const today = state.bills.filter((bill) => bill.businessDate === state.businessDate);
  return {
    ...floorView(state, now),
    settings: { pricesInclusive: state.settings.pricesInclusive, taxMode: state.settings.taxMode, maxCashierDiscountPct: state.settings.maxCashierDiscountPct, shopName: state.settings.shopName },
    shift: shift ? shiftForTill(shift) : null,
    recentBills: today
      .slice(-30)
      .reverse()
      .map((bill) => ({ ...bill, paidP: billPaidP(state, bill.id) })),
    rewards: state.niroRewards,
    payments: state.payments.filter((payment) => today.some((bill) => bill.id === payment.billId)),
  };
}

function managerView(state: PosState, now: number) {
  return {
    now,
    businessDate: state.businessDate,
    report: dayReport(state, state.businessDate),
    closeProblems: dayCloseProblems(state),
    closes: state.dayCloses.slice(-14).reverse(),
    floor: {
      openChecks: state.checks.filter((check) => check.open).map((check) => checkView(state, check)),
    },
    approvals: state.approvals.slice(-40).reverse(),
    ingredients: state.ingredients,
    stockMoves: state.stockMoves.filter((move) => move.kind !== "sale").slice(-30).reverse(),
    shifts: state.shifts
      .slice(-20)
      .reverse()
      .map((shift) => ({ ...shift, liveExpectedP: shift.closedAt ? shift.expectedP : shiftExpectedCash(state, shift) })),
    upi: state.payments
      .filter((payment) => payment.method === "upi" && (!payment.verified || payment.status === "unmatched") && !["failed", "closed", "refunded"].includes(payment.status))
      .map((payment) => ({ ...payment, billNo: state.bills.find((bill) => bill.id === payment.billId)?.no ?? "" })),
    bills: state.bills
      .filter((bill) => bill.businessDate === state.businessDate)
      .slice(-40)
      .reverse(),
    reasons: state.reasonCodes,
  };
}

const publicStaff = ({ id, name, phone, role, active, canSettle }: Staff) => ({ id, name, phone, role, active, canSettle });

function teamView(state: PosState, actor: Actor) {
  const manage = actor.role === "manager" || actor.role === "admin";
  return {
    me: { staffId: actor.staffId, name: actor.name, role: actor.role, canSettle: state.staff.find((row) => row.id === actor.staffId)?.canSettle ?? false },
    businessDate: state.businessDate,
    canManage: manage,
    myClock: state.clock.find((row) => row.staffId === actor.staffId && !row.outAt) ?? null,
    myBag: (() => {
      const bag = state.shifts.find((row) => row.staffId === actor.staffId && !row.closedAt);
      return bag ? shiftForTill(bag) : null;
    })(),
    clockedIn: state.clock.filter((row) => !row.outAt),
    clock: (manage ? state.clock : state.clock.filter((row) => row.staffId === actor.staffId)).slice(-30).reverse(),
    roster: state.roster.filter((row) => row.date >= state.businessDate).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)),
    logins: (manage ? state.logins : state.logins.filter((row) => row.staffId === actor.staffId)).slice(-30).reverse(),
    staff: state.staff.filter((row) => row.active).map(({ id, name, role }) => ({ id, name, role })),
  };
}

function adminView(state: PosState, now: number) {
  return {
    ...managerView(state, now),
    settings: state.settings,
    outletCode: outletCode(state),
    // Where customers reach the QR pages. Empty means this same address.
    customerOrigin: (process.env.CUSTOMER_ORIGIN ?? "").trim().replace(/\/+$/, ""),
    stations: state.stations,
    taxClasses: state.taxClasses,
    categories: state.categories,
    items: state.items,
    modifierGroups: state.modifierGroups,
    modifiers: state.modifiers,
    recipes: state.recipes,
    staff: state.staff.map(publicStaff),
    rewards: state.niroRewards,
    tables: state.tables,
    audit: state.audit.slice(-80).reverse(),
    logins: state.logins.slice(-40).reverse(),
    niroOutbox: state.niroOutbox.slice(-30).reverse(),
    niroDown: state.niroDown,
    consents: state.consents.length,
    allReports: state.dayCloses.map((row) => row.report),
    tillTotals: dayReport(state, state.businessDate),
  };
}

// Public, bound to a table QR token. A guest sees the current table's order and nothing else.
function qrView(state: PosState, token: string, now: number) {
  const table = state.tables.find((row) => row.active && row.qrToken === token);
  if (!table) throw new PosError("This table QR is not valid", "bad_qr");
  const check = state.checks.find((row) => row.open && row.tableId === table.id);
  const pending = state.qrNiroPending?.[table.id];
  const memberId = check?.niroMemberId || (pending && pending.until > now ? pending.memberId : "");
  const member = memberId ? state.niroMembers.find((row) => row.id === memberId) : undefined;
  const summary = check ? checkView(state, check) : null;
  return {
    shopName: state.settings.shopName,
    tableLabel: table.label,
    menu: menuView(state, now),
    order: summary && {
      no: summary.no,
      billRequested: summary.billRequested,
      waiterCalled: summary.waiterCalled,
      qrPending: summary.qrPending,
      totalP: summary.bills.filter((bill) => bill.status === "issued").reduce((sum, bill) => sum + bill.totalP, 0) + summary.preview.totalP,
      lines: summary.lines
        .filter((line) => line.status !== "void")
        .map(({ id, name, qty, mods, note, status, unitP }) => ({ id, name, qty, mods, note, status, unitP })),
    },
    pay: check ? { enabled: qrPayState(state, check).available } : { enabled: false },
    demoMode: state.settings.demoMode,
    member: member ? { name: member.name, points: member.points } : null,
    rewards: member ? state.niroRewards.filter((reward) => reward.cost <= member.points).map(({ id, name, cost }) => ({ id, name, cost })) : [],
  };
}

// Item on/off list. No prices, so kitchen staff can use it.
function itemsView(state: PosState, now: number) {
  return {
    categories: state.categories.slice().sort((a, b) => a.sort - b.sort).map(({ id, name }) => ({ id, name })),
    items: state.items
      .filter((item) => item.active)
      .map((item) => ({
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        veg: item.veg,
        on: !itemSoldOut(state, item, now),
        stockOut: stockBlocked(state, item),
        soldOut: item.soldOut,
        until: item.soldOut === "until" ? item.soldOutUntil : null,
      })),
  };
}
export type ItemsView = ReturnType<typeof itemsView>;

const VIEW_ROLES: Record<string, Role[]> = {
  floor: ["captain", "cashier", "manager", "admin"],
  till: ["cashier", "manager", "admin", "captain"],
  kds: ["kitchen", "manager", "admin"],
  manager: ["manager", "admin"],
  items: ["kitchen", "manager", "admin"],
  admin: ["admin"],
  team: ["captain", "kitchen", "cashier", "manager", "admin"],
};

export function view(state: PosState, actor: Actor, name: string, now: number, args: { token?: string } = {}) {
  if (name === "qr") return qrView(state, args.token ?? "", now);
  const roles = Object.hasOwn(VIEW_ROLES, name) ? VIEW_ROLES[name] : null;
  if (!roles) throw new PosError("Unknown view", "unknown_view");
  if (!actor.role || !roles.includes(actor.role)) throw new PosError("Your role cannot see this", "forbidden");
  switch (name) {
    case "floor":
      return floorView(state, now);
    case "till":
      return tillView(state, actor, now);
    case "kds":
      return kdsView(state, now);
    case "manager":
      return managerView(state, now);
    case "items":
      return itemsView(state, now);
    case "admin":
      return adminView(state, now);
    default:
      return teamView(state, actor);
  }
}
