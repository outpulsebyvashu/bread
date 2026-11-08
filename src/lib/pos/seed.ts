// Demo outlet: menu, tables, stock and staff. All of it is sample data.
import { createHash } from "node:crypto";
import { istDate } from "./money.ts";
import type { Item, Modifier, ModifierGroup, PosState, RecipeRow } from "./types.ts";

export function hashPin(pin: string) {
  return createHash("sha256").update(`breadpos-demo:${pin}`).digest("hex");
}

export const DEMO_MANAGER_PIN = "1234";
export const DEMO_ADMIN_PIN = "0000";
export const DEMO_NIRO_OTP = "123456";
export const DEMO_STAFF_PHONES: Record<string, string> = {
  s_captain: "9800000011",
  s_captain2: "9800000012",
  s_kitchen: "9800000021",
  s_cashier: "9800000031",
  s_manager: "9800000041",
  s_admin: "9800000051",
};

const rupees = (value: number) => value * 100;

export function createSeedState(now: number): PosState {
  const item = (
    id: string,
    categoryId: string,
    name: string,
    price: number,
    stationId: string,
    extra: Partial<Item> = {},
  ): Item => ({
    id,
    categoryId,
    name,
    priceP: rupees(price),
    veg: true,
    stationId,
    taxClassId: "restaurant_5",
    active: true,
    soldOut: "none",
    soldOutUntil: null,
    ignoreStock: false,
    ...extra,
  });

  const items: Item[] = [
    item("cappuccino", "coffee", "Cappuccino", 180, "bar"),
    item("latte", "coffee", "Caffe Latte", 190, "bar"),
    item("americano", "coffee", "Americano", 150, "bar"),
    item("cold_brew", "coffee", "Cold Brew", 210, "bar"),
    item("masala_chai", "coffee", "Masala Chai", 90, "bar"),
    item("sourdough_toast", "kitchen", "Sourdough Toast", 220, "kitchen"),
    item("focaccia_sandwich", "kitchen", "Focaccia Sandwich", 320, "kitchen"),
    item("chicken_sandwich", "kitchen", "Chicken Pesto Sandwich", 360, "kitchen", { veg: false }),
    item("shakshuka", "kitchen", "Shakshuka", 340, "kitchen", { veg: false }),
    item("croissant", "bakery", "Butter Croissant", 150, "pastry"),
    item("banana_bread", "bakery", "Banana Bread", 140, "pastry"),
    item("cinnamon_roll", "bakery", "Cinnamon Roll", 170, "pastry"),
  ];

  const group = (id: string, itemId: string, name: string, min: number, max: number): ModifierGroup => ({
    id,
    itemId,
    name,
    min,
    max,
  });
  const modifierGroups: ModifierGroup[] = [];
  const modifiers: Modifier[] = [];
  const recipes: RecipeRow[] = [];

  for (const itemId of ["cappuccino", "latte"]) {
    modifierGroups.push(group(`${itemId}_milk`, itemId, "Milk", 1, 1), group(`${itemId}_extras`, itemId, "Extras", 0, 2));
    modifiers.push(
      { id: `${itemId}_whole`, groupId: `${itemId}_milk`, name: "Whole milk", priceP: 0, available: true },
      { id: `${itemId}_oat`, groupId: `${itemId}_milk`, name: "Oat milk", priceP: rupees(60), available: true },
      { id: `${itemId}_shot`, groupId: `${itemId}_extras`, name: "Extra shot", priceP: rupees(50), available: true },
      { id: `${itemId}_vanilla`, groupId: `${itemId}_extras`, name: "Vanilla", priceP: rupees(40), available: true },
    );
    recipes.push(
      { ownerId: itemId, ingredientId: "beans", qty: 18 },
      { ownerId: `${itemId}_whole`, ingredientId: "milk", qty: 0.2 },
      { ownerId: `${itemId}_oat`, ingredientId: "oat_milk", qty: 0.2 },
      { ownerId: `${itemId}_shot`, ingredientId: "beans", qty: 9 },
    );
  }
  modifierGroups.push(group("toast_spread", "sourdough_toast", "Spread", 0, 1));
  modifiers.push(
    { id: "toast_butter", groupId: "toast_spread", name: "Salted butter", priceP: 0, available: true },
    { id: "toast_avo", groupId: "toast_spread", name: "Smashed avocado", priceP: rupees(120), available: true },
  );
  recipes.push(
    { ownerId: "americano", ingredientId: "beans", qty: 18 },
    { ownerId: "cold_brew", ingredientId: "beans", qty: 30 },
    { ownerId: "sourdough_toast", ingredientId: "sourdough", qty: 1 },
    { ownerId: "toast_butter", ingredientId: "butter", qty: 0.02 },
    { ownerId: "croissant", ingredientId: "croissant_stock", qty: 1 },
    { ownerId: "focaccia_sandwich", ingredientId: "focaccia", qty: 1 },
  );

  return {
    version: 1,
    seq: 1,
    businessDate: istDate(now),
    settings: {
      shopName: "breadPOS Demo Cafe",
      legalName: "Demo Cafe (sample)",
      address: "Sample address, Bengaluru, Karnataka",
      gstin: "",
      fssai: "",
      taxMode: "regular",
      pricesInclusive: false,
      roundOff: true,
      maxCashierDiscountPct: 10,
      varianceThresholdP: rupees(100),
      qrMode: "accept_first",
      niroPointsPer100: 10,
      niroOutletCode: "",
      demoMode: true,
    },
    stations: [
      { id: "kitchen", name: "Kitchen" },
      { id: "bar", name: "Bar" },
      { id: "pastry", name: "Pastry" },
    ],
    tables: Array.from({ length: 14 }, (_, index) => ({
      id: `T${index + 1}`,
      label: `T${index + 1}`,
      qrToken: createHash("sha256").update(`table-T${index + 1}`).digest("hex").slice(0, 12),
      active: true,
    })),
    categories: [
      { id: "coffee", name: "Coffee and chai", sort: 1 },
      { id: "kitchen", name: "From the kitchen", sort: 2 },
      { id: "bakery", name: "Bakery", sort: 3 },
    ],
    taxClasses: [{ id: "restaurant_5", name: "Restaurant service 5%", ratePct: 5, sacHsn: "996331" }],
    items,
    modifierGroups,
    modifiers,
    ingredients: [
      { id: "beans", name: "Coffee beans", unit: "g", stock: 4000, lowAt: 1000 },
      { id: "milk", name: "Whole milk", unit: "L", stock: 30, lowAt: 6 },
      { id: "oat_milk", name: "Oat milk", unit: "L", stock: 2, lowAt: 5 },
      { id: "sourdough", name: "Sourdough slices", unit: "pc", stock: 40, lowAt: 10 },
      { id: "butter", name: "Butter", unit: "kg", stock: 0.4, lowAt: 2 },
      { id: "croissant_stock", name: "Croissants", unit: "pc", stock: 24, lowAt: 6 },
      { id: "focaccia", name: "Focaccia loaves", unit: "pc", stock: 18, lowAt: 5 },
    ],
    recipes,
    stockMoves: [],
    staff: [
      { id: "s_captain", phone: DEMO_STAFF_PHONES.s_captain, name: "Asha", role: "captain", active: true, canSettle: true, pinHash: hashPin("1111") },
      { id: "s_captain2", phone: DEMO_STAFF_PHONES.s_captain2, name: "Rohan", role: "captain", active: true, canSettle: false, pinHash: hashPin("1112") },
      { id: "s_kitchen", phone: DEMO_STAFF_PHONES.s_kitchen, name: "Ravi", role: "kitchen", active: true, canSettle: false, pinHash: hashPin("2222") },
      { id: "s_cashier", phone: DEMO_STAFF_PHONES.s_cashier, name: "Meera", role: "cashier", active: true, canSettle: true, pinHash: hashPin("3333") },
      { id: "s_manager", phone: DEMO_STAFF_PHONES.s_manager, name: "Dev (manager)", role: "manager", active: true, canSettle: true, pinHash: hashPin(DEMO_MANAGER_PIN) },
      { id: "s_admin", phone: DEMO_STAFF_PHONES.s_admin, name: "Owner", role: "admin", active: true, canSettle: true, pinHash: hashPin(DEMO_ADMIN_PIN) },
    ],
    checks: [],
    kots: [],
    bills: [],
    payments: [],
    shifts: [],
    approvals: [],
    audit: [],
    series: {},
    checkNo: 1000,
    kotNo: 0,
    reasonCodes: {
      void: ["Wrong item punched", "Guest changed mind", "Item unavailable", "Kitchen error", "Other"],
      comp: ["Guest complaint", "Quality issue", "Staff or owner guest", "Other"],
      discount: ["Regular guest", "Service recovery", "Staff meal", "Promotion", "Other"],
      cancel: ["Billing mistake", "Wrong table", "Guest disputed bill", "Other"],
      credit: ["Refund to guest", "Billing mistake found later", "Other"],
      upi_override: ["Provider down", "Static QR used", "Network outage", "Other"],
    },
    pinFails: 0,
    pinLockedUntil: 0,
    niroMembers: [
      { id: "niro_1", name: "Priya S", phone: "9000000001", points: 240 },
      { id: "niro_2", name: "Arjun K", phone: "9000000002", points: 80 },
    ],
    niroRewards: [
      { id: "reward_coffee", name: "₹100 off", discountP: rupees(100), cost: 100 },
      { id: "reward_big", name: "₹250 off", discountP: rupees(250), cost: 200 },
    ],
    niroOutbox: [],
    niroLedger: [],
    niroDown: false,
    consents: [],
    dayCloses: [],
    clock: [],
    roster: [],
    logins: [],
    loginLocks: {},
  };
}
