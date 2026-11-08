// breadPOS domain model. All money is integer paise (fields ending in P).
// This is the contract the Postgres schema must implement at the Supabase step.
import type { AppId, Role } from "../roles/index.ts";

export type Actor = { role: Role | null; staffId: string | null; name: string };

export type Channel = "dine_in" | "takeaway" | "qr";
export type LineStatus = "awaiting" | "held" | "new" | "preparing" | "ready" | "served" | "void" | "comp";
export type StockOutcome = "none" | "deducted" | "returned" | "wasted";
export type TaxMode = "regular" | "composition";
export type DocType = "tax_invoice" | "bill_of_supply" | "credit_note";
export type PaymentMethod = "cash" | "card" | "upi";
export type PaymentStatus = "pending" | "confirmed" | "failed" | "closed" | "unmatched" | "refunded";

export type Settings = {
  shopName: string;
  legalName: string;
  address: string;
  gstin: string;
  fssai: string;
  taxMode: TaxMode;
  pricesInclusive: boolean;
  roundOff: boolean;
  maxCashierDiscountPct: number;
  varianceThresholdP: number;
  qrMode: "accept_first" | "auto";
  niroPointsPer100: number;
  niroOutletCode: string;
  // Demo mode: customers can pay with the simulated UPI, and the launcher opens a sample customer table.
  // Switch it off before real use. No real payment provider is connected yet.
  demoMode: boolean;
};

export type Station = { id: string; name: string };
export type TableRow = { id: string; label: string; qrToken: string; active: boolean };
export type Category = { id: string; name: string; sort: number };
export type TaxClass = { id: string; name: string; ratePct: number; sacHsn: string };
export type Item = {
  id: string;
  categoryId: string;
  name: string;
  priceP: number;
  veg: boolean;
  stationId: string;
  taxClassId: string;
  active: boolean;
  soldOut: "none" | "day" | "indefinite" | "until";
  soldOutUntil: number | null;
  ignoreStock: boolean;
};
export type ModifierGroup = { id: string; itemId: string; name: string; min: number; max: number };
export type Modifier = { id: string; groupId: string; name: string; priceP: number; available: boolean };
export type Ingredient = { id: string; name: string; unit: string; stock: number; lowAt: number };
export type RecipeRow = { ownerId: string; ingredientId: string; qty: number };
export type StockMove = {
  id: string;
  at: number;
  ingredientId: string;
  delta: number;
  kind: "sale" | "void_return" | "receive" | "adjust" | "waste";
  ref: string;
  actor: string;
  reason: string;
};
export type Staff = { id: string; name: string; phone: string; role: Role; active: boolean; canSettle: boolean; pinHash: string };
export type ClockRow = { id: string; staffId: string; staffName: string; businessDate: string; inAt: number; outAt: number | null };
export type RosterRow = { id: string; staffId: string; staffName: string; date: string; start: string; end: string; section: string };
export type LoginRow = { id: number; at: number; staffId: string; staffName: string; role: Role | null; app: AppId | "auth"; ok: boolean; detail: string };

export type Line = {
  id: string;
  checkId: string;
  itemId: string;
  name: string;
  qty: number;
  unitP: number;
  mods: string[];
  modifierIds: string[];
  note: string;
  taxClassId: string;
  stationId: string;
  status: LineStatus;
  kotId: string | null;
  billId: string | null;
  stock: StockOutcome;
  reason: string;
};

export type Kot = {
  id: string;
  no: number;
  checkId: string;
  originCheckId: string;
  round: number;
  stationId: string;
  at: number;
  acceptedAt: number | null;
  readyAt: number | null;
  alert: string;
  reprints: number;
};

export type Check = {
  id: string;
  no: number;
  tableId: string | null;
  channel: Channel;
  covers: number;
  open: boolean;
  billRequested: boolean;
  waiterCalled: boolean;
  qrPending: boolean;
  captain: string;
  openedAt: number;
  closedAt: number | null;
  mergedInto: string | null;
  round: number;
  lines: Line[];
  discountP: number;
  discountReason: string;
  discountBy: string;
  niroRewardRef: string;
  niroRewardId: string;
  niroMemberId: string;
  businessDate: string;
  cancelledReason: string;
};

export type BillLine = {
  lineId: string;
  name: string;
  mods: string[];
  qtyLabel: string;
  grossP: number;
  discountP: number;
  taxableP: number;
  ratePct: number;
  cgstP: number;
  sgstP: number;
  sacHsn: string;
  comp: boolean;
  itemId: string;
  qtySold: number;
};

export type Bill = {
  id: string;
  no: string;
  docType: DocType;
  fy: string;
  businessDate: string;
  checkId: string;
  checkNo: number;
  tableLabel: string;
  channel: Channel;
  at: number;
  issuedBy: string;
  shareLabel: string;
  lines: BillLine[];
  subtotalP: number;
  discountP: number;
  discountReason: string;
  taxableP: number;
  cgstP: number;
  sgstP: number;
  roundOffP: number;
  totalP: number;
  buyerGstin: string;
  buyerName: string;
  status: "issued" | "cancelled" | "credited";
  statusReason: string;
  originalId: string;
  paid: boolean;
  reprints: number;
  seller: { legalName: string; address: string; gstin: string; fssai: string; shopName: string };
};

export type Payment = {
  id: string;
  billId: string;
  shiftId: string | null;
  method: PaymentMethod;
  amountP: number;
  status: PaymentStatus;
  tenderedP: number;
  changeP: number;
  ref: string;
  provider: string;
  verified: boolean;
  reason: string;
  key: string;
  at: number;
  actor: string;
  expiresAt: number | null;
};

export type CashMove = { id: string; at: number; kind: "in" | "out"; amountP: number; reason: string };
export type Shift = {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: number;
  closedAt: number | null;
  floatP: number;
  moves: CashMove[];
  expectedP: number | null;
  countedP: number | null;
  varianceP: number | null;
  note: string;
  approvedBy: string;
  businessDate: string;
};

export type Approval = {
  id: string;
  at: number;
  action: string;
  requester: string;
  approver: string;
  reason: string;
  amountP: number;
  ref: string;
};

export type AuditRow = { id: number; at: number; actor: string; role: string; type: string; detail: string };

export type NiroMember = { id: string; name: string; phone: string; points: number };
export type NiroReward = { id: string; name: string; discountP: number; cost: number };
export type NiroOutbox = {
  id: string;
  kind: "earn" | "reverse";
  memberId: string;
  amountP: number;
  orderRef: string;
  status: "pending" | "done" | "failed";
  attempts: number;
  lastError: string;
  at: number;
};
export type Consent = { id: string; memberId: string; purpose: "loyalty" | "offers"; noticeVersion: string; at: number };
export type DayClose = { businessDate: string; closedAt: number; closedBy: string; report: DayReport };

export type DayReport = {
  businessDate: string;
  billCount: number;
  orderCount: number;
  grossP: number;
  discountP: number;
  taxableP: number;
  cgstP: number;
  sgstP: number;
  roundOffP: number;
  totalP: number;
  creditNotesP: number;
  averageBillP: number;
  tenders: Record<PaymentMethod, number>;
  channels: Record<Channel, number>;
  hourly: { hour: number; totalP: number }[];
  topItems: { name: string; qty: number; amountP: number }[];
  ticketMinutes: number;
  leakage: {
    voids: number;
    comps: number;
    reprints: number;
    cancelledBills: number;
    creditNotes: number;
    unverifiedUpi: number;
    otherReasons: number;
    discountsByUser: { name: string; amountP: number }[];
  };
  upi: { confirmedP: number; unverifiedP: number; pending: number; unmatched: number };
  variances: { staffName: string; varianceP: number; closedAt: number }[];
};

export type PosState = {
  version: number;
  seq: number;
  businessDate: string;
  settings: Settings;
  stations: Station[];
  tables: TableRow[];
  categories: Category[];
  taxClasses: TaxClass[];
  items: Item[];
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
  ingredients: Ingredient[];
  recipes: RecipeRow[];
  stockMoves: StockMove[];
  staff: Staff[];
  checks: Check[];
  kots: Kot[];
  bills: Bill[];
  payments: Payment[];
  shifts: Shift[];
  approvals: Approval[];
  audit: AuditRow[];
  series: Record<string, number>;
  checkNo: number;
  kotNo: number;
  reasonCodes: Record<"void" | "comp" | "discount" | "cancel" | "credit" | "upi_override", string[]>;
  pinFails: number;
  pinLockedUntil: number;
  niroMembers: NiroMember[];
  niroRewards: NiroReward[];
  niroOutbox: NiroOutbox[];
  niroLedger: string[];
  niroDown: boolean;
  consents: Consent[];
  dayCloses: DayClose[];
  clock: ClockRow[];
  roster: RosterRow[];
  logins: LoginRow[];
  loginLocks: Record<string, { fails: number; until: number }>;
  // A customer who signed in to Niro before ordering. Used by the table's next order, or it expires.
  qrNiroPending?: Record<string, { memberId: string; until: number }>;
};

export type Approvalish = { pin?: string; reason: string };
export type CartItem = { itemId: string; qty: number; modifierIds?: string[]; note?: string; hold?: boolean };
