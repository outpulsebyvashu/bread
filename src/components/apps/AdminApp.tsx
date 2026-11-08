"use client";

import { BarChart3, BookOpen, Clock, LayoutGrid, Link2, Package, QrCode, ScrollText, Settings, Store, UsersRound } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CommandError, postJson, sendCommand, timeLabel, toPaise, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { AdminView } from "@/lib/pos/views";
import type { Role } from "@/lib/roles";
import { HostProvider } from "@/lib/client/host";
import { AppFrame, type Tab } from "../AppFrame";
import { PrintNow } from "../PrintDocs";
import { ReportPanel, SalesCard, SalesHero } from "../ReportPanel";
import { Button, Card, Chip, Dashes, ErrorText, Field, Loading, PageTitle, Segmented, SelectField, Sheet, Star, Stat } from "../ui";
import { CaptainApp } from "./CaptainApp";
import { ItemsApp } from "./ItemsApp";
import { KdsApp } from "./KdsApp";
import { ManagerApp, StockPanel } from "./ManagerApp";
import { TillApp } from "./TillApp";
import { TeamPanel } from "./TeamPanel";

type TabId = "overview" | "shop" | "menu" | "stock" | "staff" | "team" | "tables" | "settings" | "niro" | "reports" | "audit";
const LOGIN = "/admin/login";
const money = (paise: number) => formatRupees(paise / 100);

const TABS: Tab<TabId>[] = [
  { id: "overview", label: "Owner dashboard", short: "Home", icon: LayoutGrid },
  { id: "shop", label: "Run the shop", short: "Shop", icon: Store },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "menu", label: "Menu and recipes", short: "Menu", icon: BookOpen },
  { id: "staff", label: "Staff and access", short: "Staff", icon: UsersRound },
  { id: "stock", label: "Stock", icon: Package },
  { id: "team", label: "Roster and clock", short: "Roster", icon: Clock },
  { id: "tables", label: "Tables and QR", short: "Tables", icon: QrCode },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "niro", label: "Niro.Cards", short: "Niro", icon: Link2 },
  { id: "audit", label: "Audit log", icon: ScrollText },
];

type Act = (type: string, args?: unknown) => Promise<boolean>;

function Overview({ data, onTab }: { data: AdminView; onTab: (tab: TabId) => void }) {
  const low = data.ingredients.filter((row) => row.stock <= row.lowAt);
  const setupMissing = (!data.settings.gstin && data.settings.taxMode === "regular") || !data.settings.fssai;
  return (
    <>
      <PageTitle muted="Today's" strong="overview" />
      {setupMissing && (
        <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mustard px-4 py-2 text-sm font-medium">
          Billing is blocked until the GSTIN and FSSAI number are saved.
          <Button onClick={() => onTab("settings")}>Open settings</Button>
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        <SalesHero report={data.report} closes={data.closes} className="sm:col-span-2 lg:col-span-4" />
        <SalesCard report={data.report} closes={data.closes} className="sm:col-span-2 lg:col-span-8" />
        <Card className="bg-lilac lg:col-span-3">
          <Star className="absolute top-4 right-4 size-10 text-ink/10" />
          <h2 className="text-sm">Open checks</h2>
          <p className="mt-6 text-5xl font-bold tracking-tight">{data.floor.openChecks.length}</p>
          <p className="mt-2 text-xs">of {data.tables.filter((table) => table.active).length} tables and counter</p>
        </Card>
        <Stat label="Ticket time" value={data.report.ticketMinutes} unit="min" className="bg-card lg:col-span-3" />
        <Card className="bg-card sm:col-span-2 lg:col-span-6">
          <h2 className="text-lg font-semibold">Payments</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-olive p-4">
              <p className="text-xs font-semibold">UPI</p>
              <p className="mt-2 font-bold">{money(data.report.tenders.upi)}</p>
            </div>
            <div className="rounded-3xl bg-mustard p-4">
              <p className="text-xs font-semibold">Cash</p>
              <p className="mt-2 font-bold">{money(data.report.tenders.cash)}</p>
            </div>
            <div className="rounded-3xl bg-pink p-4">
              <p className="text-xs font-semibold">Card</p>
              <p className="mt-2 font-bold">{money(data.report.tenders.card)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-card lg:col-span-4">
          <h2 className="text-lg font-semibold">Top sellers</h2>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {data.report.topItems.slice(0, 4).map((row) => (
              <li key={row.name} className="flex min-h-11 items-center justify-between gap-2 py-2">
                <span>
                  {row.name} <span className="text-xs text-muted">{Math.round(row.qty * 100) / 100} sold</span>
                </span>
                <span className="font-semibold">{money(row.amountP)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col bg-periwinkle lg:col-span-4">
          <h2 className="text-lg font-semibold">Running low</h2>
          <ul className="mt-3 flex flex-1 flex-col gap-4">
            {low.map((row) => (
              <li key={row.id} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-xs">
                    {row.stock} {row.unit} left, keep {row.lowAt} {row.unit}
                  </span>
                </span>
                <Dashes count={Math.round((row.stock / Math.max(row.lowAt, 1)) * 10)} total={10} />
              </li>
            ))}
            {low.length === 0 && <li className="text-sm">Stock looks fine.</li>}
          </ul>
          <Button className="mt-5" onClick={() => onTab("stock")}>
            Receive stock
          </Button>
        </Card>
        <Card className="bg-card sm:col-span-2 lg:col-span-4">
          <h2 className="text-lg font-semibold">Things to review</h2>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {([["Voids and comps", data.report.leakage.voids + data.report.leakage.comps], ["Cancelled bills", data.report.leakage.cancelledBills], ["Reprints", data.report.leakage.reprints], ["Unverified UPI", data.report.leakage.unverifiedUpi]] as const).map(([label, value]) => (
              <li key={label} className="flex min-h-11 items-center justify-between py-2">
                <span>{label}</span>
                <span className="font-semibold">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function ItemEditor({ data, itemId, act, onClose }: { data: AdminView; itemId: string | null; act: Act; onClose: () => void }) {
  const item = data.items.find((row) => row.id === itemId);
  const [form, setForm] = useState({ name: item?.name ?? "", price: item ? String(item.priceP / 100) : "", categoryId: item?.categoryId ?? data.categories[0]?.id ?? "", stationId: item?.stationId ?? data.stations[0]?.id ?? "", taxClassId: item?.taxClassId ?? data.taxClasses[0]?.id ?? "", veg: item?.veg ?? true, active: item?.active ?? true });
  const [groupName, setGroupName] = useState("");
  const [groupRequired, setGroupRequired] = useState(false);
  const [optionDraft, setOptionDraft] = useState<Record<string, { name: string; price: string }>>({});
  const [recipeDraft, setRecipeDraft] = useState({ ownerId: "", ingredientId: "", qty: "" });
  const groups = data.modifierGroups.filter((group) => group.itemId === itemId);
  const recipeRows = (ownerId: string) => data.recipes.filter((row) => row.ownerId === ownerId);
  const owners = item ? [{ id: item.id, name: `${item.name} (base)` }, ...groups.flatMap((group) => data.modifiers.filter((row) => row.groupId === group.id).map((row) => ({ id: row.id, name: row.name })))] : [];

  return (
    <Sheet title={item ? `Edit ${item.name}` : "New item"} onClose={onClose} wide>
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await act("upsert_item", { id: item?.id, name: form.name, priceP: toPaise(form.price), categoryId: form.categoryId, stationId: form.stationId, taxClassId: form.taxClassId, veg: form.veg, active: form.active });
          if (ok && !item) onClose();
        }}
      >
        <Field label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Field label="Price before tax (₹)" inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <SelectField label="Category" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
          {data.categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </SelectField>
        <SelectField label="Kitchen station" value={form.stationId} onChange={(event) => setForm({ ...form, stationId: event.target.value })}>
          {data.stations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </SelectField>
        <SelectField label="Tax class (ask your CA)" value={form.taxClassId} onChange={(event) => setForm({ ...form, taxClassId: event.target.value })}>
          {data.taxClasses.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </SelectField>
        <div className="flex flex-wrap items-end gap-2">
          <Button variant={form.veg ? "lime" : "soft"} aria-pressed={form.veg} onClick={() => setForm({ ...form, veg: !form.veg })}>{form.veg ? "Veg" : "Non-veg"}</Button>
          <Button variant={form.active ? "lime" : "soft"} aria-pressed={form.active} onClick={() => setForm({ ...form, active: !form.active })}>{form.active ? "On the menu" : "Off the menu"}</Button>
          <Button type="submit" className="ml-auto">Save item</Button>
        </div>
      </form>

      {item && (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-canvas p-4">
            <h3 className="font-semibold">Options</h3>
            <ul className="mt-2 flex flex-col gap-3">
              {groups.map((group) => (
                <li key={group.id} className="rounded-2xl bg-card p-3">
                  <p className="flex items-center justify-between gap-2 text-sm font-medium">
                    {group.name} ({group.min > 0 ? "required" : "optional"}, max {group.max})
                    <Button variant="ghost" onClick={() => act("delete_modifier_group", { id: group.id })}>Delete</Button>
                  </p>
                  <ul className="text-sm">
                    {data.modifiers.filter((row) => row.groupId === group.id).map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-2">
                        {row.name} +{money(row.priceP)}
                        <Button variant="ghost" onClick={() => act("delete_modifier", { id: row.id })}>Remove</Button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 grid grid-cols-[1fr_5rem_auto] items-end gap-2">
                    <Field label="Option" value={optionDraft[group.id]?.name ?? ""} onChange={(event) => setOptionDraft({ ...optionDraft, [group.id]: { name: event.target.value, price: optionDraft[group.id]?.price ?? "0" } })} />
                    <Field label="₹" inputMode="decimal" value={optionDraft[group.id]?.price ?? "0"} onChange={(event) => setOptionDraft({ ...optionDraft, [group.id]: { name: optionDraft[group.id]?.name ?? "", price: event.target.value } })} />
                    <Button variant="soft" onClick={async () => {
                      const draft = optionDraft[group.id];
                      if (draft && (await act("upsert_modifier", { groupId: group.id, name: draft.name, priceP: toPaise(draft.price) }))) setOptionDraft({ ...optionDraft, [group.id]: { name: "", price: "0" } });
                    }}>Add</Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-32 flex-1">
                <Field label="New option group" value={groupName} onChange={(event) => setGroupName(event.target.value)} />
              </div>
              <Button variant={groupRequired ? "lime" : "soft"} className={groupRequired ? "" : "bg-card"} aria-pressed={groupRequired} onClick={() => setGroupRequired(!groupRequired)}>{groupRequired ? "Required" : "Optional"}</Button>
              <Button variant="soft" className="bg-card" disabled={!groupName.trim()} onClick={async () => {
                if (await act("upsert_modifier_group", { itemId: item.id, name: groupName, min: groupRequired ? 1 : 0, max: groupRequired ? 1 : 3 })) setGroupName("");
              }}>Add group</Button>
            </div>
          </div>

          <div className="rounded-3xl bg-canvas p-4">
            <h3 className="font-semibold">Recipe (stock used per item sold)</h3>
            <ul className="mt-2 text-sm">
              {owners.flatMap((owner) => recipeRows(owner.id).map((row) => {
                const ingredient = data.ingredients.find((entry) => entry.id === row.ingredientId);
                return (
                  <li key={`${row.ownerId}${row.ingredientId}`} className="flex items-center justify-between gap-2">
                    <span>{owner.name}: {row.qty} {ingredient?.unit} {ingredient?.name}</span>
                    <Button variant="ghost" onClick={() => act("set_recipe", { ownerId: row.ownerId, ingredientId: row.ingredientId, qty: 0 })}>Remove</Button>
                  </li>
                );
              }))}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
              <SelectField label="Used by" value={recipeDraft.ownerId} onChange={(event) => setRecipeDraft({ ...recipeDraft, ownerId: event.target.value })}>
                <option value="">Choose</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </SelectField>
              <SelectField label="Ingredient" value={recipeDraft.ingredientId} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredientId: event.target.value })}>
                <option value="">Choose</option>
                {data.ingredients.map((row) => <option key={row.id} value={row.id}>{row.name} ({row.unit})</option>)}
              </SelectField>
              <Field label="Quantity" inputMode="decimal" value={recipeDraft.qty} onChange={(event) => setRecipeDraft({ ...recipeDraft, qty: event.target.value })} />
              <Button variant="soft" className="bg-card" disabled={!recipeDraft.ownerId || !recipeDraft.ingredientId || !(Number(recipeDraft.qty) > 0)} onClick={async () => {
                if (await act("set_recipe", { ownerId: recipeDraft.ownerId, ingredientId: recipeDraft.ingredientId, qty: Number(recipeDraft.qty) })) setRecipeDraft({ ownerId: "", ingredientId: "", qty: "" });
              }}>Save recipe line</Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function MenuTab({ data, act }: { data: AdminView; act: Act }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [category, setCategory] = useState("");
  const [ingredient, setIngredient] = useState({ name: "", unit: "pc", lowAt: "" });
  return (
    <>
      <PageTitle muted="Menu" strong="and recipes">
        <Button onClick={() => setEditing("new")}>New item</Button>
      </PageTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {[...data.categories].sort((a, b) => a.sort - b.sort).map((row) => {
            const items = data.items.filter((item) => item.categoryId === row.id);
            return (
              <Card key={row.id} className="bg-card">
                <h2 className="flex items-center justify-between gap-2 text-lg font-semibold">
                  {row.name}
                  {items.every((item) => !item.active) && <Button variant="ghost" onClick={() => act("delete_category", { id: row.id })}>Delete</Button>}
                </h2>
                <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setEditing(item.id)} className="tap flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl bg-canvas px-4 py-2 text-left text-sm hover:bg-lime">
                        <span className="font-medium">{item.name}{!item.active && <Chip className="ml-2 bg-card">Off</Chip>}</span>
                        <span>{money(item.priceP)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
        <div className="flex flex-col gap-4">
          <Card className="bg-card">
            <h2 className="text-lg font-semibold">New category</h2>
            <div className="mt-2 flex flex-col gap-2">
              <Field label="Name" value={category} onChange={(event) => setCategory(event.target.value)} />
              <Button variant="soft" disabled={!category.trim()} onClick={async () => { if (await act("upsert_category", { name: category })) setCategory(""); }}>Add category</Button>
            </div>
          </Card>
          <Card className="bg-card">
            <h2 className="text-lg font-semibold">New ingredient</h2>
            <div className="mt-2 flex flex-col gap-2">
              <Field label="Name" value={ingredient.name} onChange={(event) => setIngredient({ ...ingredient, name: event.target.value })} />
              <Field label="Unit" value={ingredient.unit} onChange={(event) => setIngredient({ ...ingredient, unit: event.target.value })} />
              <Field label="Warn when at or below" inputMode="decimal" value={ingredient.lowAt} onChange={(event) => setIngredient({ ...ingredient, lowAt: event.target.value })} />
              <Button variant="soft" disabled={!ingredient.name.trim()} onClick={async () => { if (await act("upsert_ingredient", { ...ingredient, lowAt: Number(ingredient.lowAt) })) setIngredient({ name: "", unit: "pc", lowAt: "" }); }}>Add ingredient</Button>
            </div>
          </Card>
        </div>
      </div>
      {editing && <ItemEditor data={data} itemId={editing === "new" ? null : editing} act={act} onClose={() => setEditing(null)} />}
    </>
  );
}

const ROLE_LABELS: Record<Role, string> = { admin: "Owner / admin", manager: "Manager", cashier: "Cashier", captain: "Captain", kitchen: "Kitchen" };
const APP_ACCESS: Record<Role, string> = { admin: "POS, Captain, POS Admin", manager: "POS, Captain", cashier: "POS", captain: "Captain", kitchen: "POS (kitchen board)" };

function StaffTab({ data, act }: { data: AdminView; act: Act }) {
  const blank = { id: "", name: "", phone: "", role: "captain" as Role, pin: "", canSettle: false, active: true };
  const [form, setForm] = useState(blank);
  return (
    <>
      <PageTitle muted="Staff" strong="and access" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="bg-card">
          <ul className="divide-y divide-dashed divide-hairline">
            {data.staff.map((row) => (
              <li key={row.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium">{row.name} {!row.active && <Chip className="bg-pink">Inactive</Chip>}</p>
                  <p className="text-xs text-muted">{row.phone || "No phone number, cannot sign in"} · {ROLE_LABELS[row.role]} · Signs in to {APP_ACCESS[row.role]}{row.role === "captain" && (row.canSettle ? " · Can check out" : " · No checkout")}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {row.role === "captain" && (
                    <Button variant={row.canSettle ? "lime" : "soft"} aria-pressed={row.canSettle} onClick={() => act("upsert_staff", { id: row.id, name: row.name, role: row.role, canSettle: !row.canSettle })}>Checkout {row.canSettle ? "on" : "off"}</Button>
                  )}
                  <Button variant="soft" onClick={() => setForm({ id: row.id, name: row.name, phone: row.phone, role: row.role, pin: "", canSettle: row.canSettle, active: row.active })}>Edit</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">{form.id ? `Edit ${form.name}` : "Add staff"}</h2>
          <form
            className="mt-2 flex flex-col gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await act("upsert_staff", { ...form, id: form.id || undefined })) setForm(blank);
            }}
          >
            <Field label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Field label="Phone number" type="tel" inputMode="tel" autoComplete="off" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} hint="They sign in with this number and their PIN." />
            <SelectField label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </SelectField>
            <Field label={form.id ? "New PIN (leave empty to keep)" : "PIN"} type="password" inputMode="numeric" autoComplete="new-password" value={form.pin} onChange={(event) => setForm({ ...form, pin: event.target.value })} hint="4 to 6 digits, personal to this person." />
            {form.id && (
              <Button variant={form.active ? "soft" : "lime"} aria-pressed={!form.active} onClick={() => setForm({ ...form, active: !form.active })}>{form.active ? "Active. Tap to deactivate" : "Inactive. Tap to reactivate"}</Button>
            )}
            <Button type="submit" disabled={!form.name.trim() || !form.phone.trim()}>{form.id ? "Save" : "Add staff"}</Button>
            {form.id && <Button variant="ghost" onClick={() => setForm(blank)}>Cancel</Button>}
          </form>
        </Card>
      </div>
    </>
  );
}

function TableQr({ path, origin, label }: { path: string; origin: string; label: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(`${origin || window.location.origin}${path}`, { type: "svg", margin: 1 }).then(setSvg);
  }, [path, origin]);
  return (
    <div className="text-center">
      <div aria-label={`QR code for ${label}`} role="img" className="mx-auto size-32" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

function TablesTab({ data, act }: { data: AdminView; act: Act }) {
  const [label, setLabel] = useState("");
  const [printing, setPrinting] = useState<{ token: string; label: string } | null>(null);
  return (
    <>
      <PageTitle muted="Tables" strong="and QR">
        <form
          className="flex items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await act("upsert_table", { label })) setLabel("");
          }}
        >
          <Field label="New table" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Button type="submit" disabled={!label.trim()}>Add</Button>
        </form>
      </PageTitle>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.tables.map((table) => (
          <li key={table.id} className="flex flex-col gap-2 rounded-3xl bg-card p-4">
            <p className="flex items-center justify-between text-lg font-semibold">
              {table.label}
              {!table.active && <Chip className="bg-pink">Off</Chip>}
            </p>
            <TableQr path={`/o/${data.outletCode}/${table.qrToken}`} origin={data.customerOrigin} label={table.label} />
            <div className="flex flex-wrap gap-1">
              <Button variant="soft" onClick={() => setPrinting({ token: table.qrToken, label: table.label })}>Print</Button>
              <a href={`${data.customerOrigin}/o/${data.outletCode}/${table.qrToken}`} target="_blank" rel="noreferrer" className="tap inline-flex min-h-11 items-center rounded-pill bg-canvas px-4 text-sm font-medium hover:bg-lime">Open</a>
              <Button variant="ghost" onClick={() => act("rotate_table_qr", { id: table.id })}>New code</Button>
              <Button variant="ghost" onClick={() => act("upsert_table", { id: table.id, label: table.label, active: !table.active })}>{table.active ? "Turn off" : "Turn on"}</Button>
            </div>
          </li>
        ))}
      </ul>
      {printing && (
        <PrintNow onDone={() => setPrinting(null)}>
          <div className="p-2 text-center text-black">
            <p className="text-lg font-bold">{printing.label}</p>
            <TableQr path={`/o/${data.outletCode}/${printing.token}`} origin={data.customerOrigin} label={printing.label} />
            <p className="text-xs">Scan to order</p>
          </div>
        </PrintNow>
      )}
    </>
  );
}

function SettingsTab({ data, act }: { data: AdminView; act: Act }) {
  const [form, setForm] = useState(data.settings);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm({ ...form, [key]: value });
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <PageTitle muted="Master" strong="settings" />
      <form
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          act("update_settings", { patch: form });
        }}
      >
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Outlet and GST</h2>
          <p className="mb-3 text-xs text-muted">Billing stays blocked until these are complete. Have your CA check tax mode, tax classes and the bill format.</p>
          <div className="flex flex-col gap-3">
            <Field label="Shop name" value={form.shopName} onChange={(event) => set("shopName", event.target.value)} />
            <Field label="Legal name" value={form.legalName} onChange={(event) => set("legalName", event.target.value)} />
            <Field label="Address" value={form.address} onChange={(event) => set("address", event.target.value)} />
            <Field label="GSTIN" value={form.gstin} onChange={(event) => set("gstin", event.target.value.toUpperCase())} />
            <Field label="FSSAI number (14 digits)" inputMode="numeric" value={form.fssai} onChange={(event) => set("fssai", event.target.value)} />
            <SelectField label="Tax mode (fixed once this financial year has bills)" value={form.taxMode} onChange={(event) => set("taxMode", event.target.value as typeof form.taxMode)}>
              <option value="regular">Regular: 5% tax invoice</option>
              <option value="composition">Composition: bill of supply, no tax collected</option>
            </SelectField>
          </div>
        </Card>
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Rules</h2>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant={form.pricesInclusive ? "lime" : "soft"} aria-pressed={form.pricesInclusive} onClick={() => set("pricesInclusive", !form.pricesInclusive)}>Prices {form.pricesInclusive ? "include" : "exclude"} tax</Button>
              <Button variant={form.roundOff ? "lime" : "soft"} aria-pressed={form.roundOff} onClick={() => set("roundOff", !form.roundOff)}>Round off {form.roundOff ? "on" : "off"}</Button>
              <Button variant={form.qrMode === "accept_first" ? "lime" : "soft"} aria-pressed={form.qrMode === "accept_first"} onClick={() => set("qrMode", form.qrMode === "accept_first" ? "auto" : "accept_first")}>
                QR: {form.qrMode === "accept_first" ? "staff accept first order" : "orders go straight to kitchen"}
              </Button>
            </div>
            <Button variant={form.demoMode ? "lime" : "soft"} aria-pressed={form.demoMode} onClick={() => set("demoMode", !form.demoMode)}>
              Demo mode {form.demoMode ? "on: customers pay with simulated UPI" : "off: customers pay at the counter"}
            </Button>
            <Field label="Cashier discount limit (%)" type="number" value={form.maxCashierDiscountPct} onChange={(event) => set("maxCashierDiscountPct", Number(event.target.value))} />
            <Field label="Cash difference needing approval (₹)" inputMode="decimal" value={form.varianceThresholdP / 100} onChange={(event) => set("varianceThresholdP", toPaise(event.target.value))} />
            <p className="rounded-2xl bg-canvas px-4 py-3 text-xs text-muted">There is no service charge setting by design. Under Indian consumer guidance a service charge cannot be added automatically. Any tip must be the guest&apos;s choice after the total.</p>
          </div>
          <Button type="submit" className="mt-3 w-full">Save settings</Button>
        </Card>
      </form>
      <Card className="mt-4 bg-card">
        <h2 className="text-lg font-semibold">Demo data</h2>
        <p className="mb-3 text-sm text-muted">Restores the sample outlet and removes everything entered since. Only for this local demo.</p>
        {confirmReset ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={() => postJson("/api/app/admin/reset", {}).then(() => window.location.reload())}>Yes, reset everything</Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Keep my data</Button>
          </div>
        ) : (
          <Button variant="soft" onClick={() => setConfirmReset(true)}>Reset demo data</Button>
        )}
      </Card>
    </>
  );
}

function NiroTab({ data, act }: { data: AdminView; act: Act }) {
  const [code, setCode] = useState(data.settings.niroOutletCode);
  const [rate, setRate] = useState(data.settings.niroPointsPer100);
  const blankReward = { id: "", name: "", rupees: "", cost: "" };
  const [reward, setReward] = useState(blankReward);
  const [test, setTest] = useState("");
  const runTest = async () => {
    setTest("");
    try {
      const { ok, outletCode } = await sendCommand<{ ok: boolean; outletCode: string }>("admin", "niro_test");
      setTest(ok ? `Mock adapter answered for outlet ${outletCode || "(no code set)"}. This does not reach the real Niro.` : "Mock adapter is simulating an outage.");
    } catch (problem) {
      setTest(problem instanceof CommandError ? problem.message : "The test did not run");
    }
  };
  return (
    <>
      <PageTitle muted="Niro" strong="Cards" />
      <p className="mb-4 rounded-2xl bg-mustard px-4 py-3 text-sm font-medium">Mock adapter. The real Niro API is not confirmed, so nothing here reaches Niro yet.</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Link and earn rate</h2>
          <div className="mt-3 flex flex-col gap-3">
            <Field label="Niro outlet code" value={code} onChange={(event) => setCode(event.target.value)} hint={`Part of every table QR address (now: ${data.outletCode}). Changing it makes printed QR codes stop working, so reprint them.`} />
            <Field label="Points per ₹100" type="number" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
            <Button onClick={() => act("update_settings", { patch: { niroOutletCode: code, niroPointsPer100: rate } })}>Save</Button>
            <p className="text-sm text-muted">Consent records stored: {data.consents}</p>
            <Button variant={data.niroDown ? "lime" : "soft"} aria-pressed={data.niroDown} onClick={() => act("set_niro_down", { down: !data.niroDown })}>
              {data.niroDown ? "Simulating Niro outage. Tap to restore" : "Simulate a Niro outage"}
            </Button>
            <Button variant="soft" onClick={runTest}>Test connection</Button>
            {test && <p role="status" className="rounded-2xl bg-canvas px-4 py-2 text-sm">{test}</p>}
          </div>
        </Card>
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Reward mapping</h2>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {data.rewards.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{row.name} · {money(row.discountP)} off · {row.cost} points</span>
                <span className="flex gap-1">
                  <Button variant="soft" onClick={() => setReward({ id: row.id, name: row.name, rupees: String(row.discountP / 100), cost: String(row.cost) })}>Edit</Button>
                  <Button variant="ghost" onClick={() => act("delete_reward", { id: row.id })}>Remove</Button>
                </span>
              </li>
            ))}
            {data.rewards.length === 0 && <li className="py-2 text-muted">No rewards yet.</li>}
          </ul>
          <form
            className="mt-3 grid grid-cols-2 gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await act("upsert_reward", { id: reward.id || undefined, name: reward.name, discountP: Math.round(Number(reward.rupees) * 100), cost: Number(reward.cost) })) setReward(blankReward);
            }}
          >
            <div className="col-span-2">
              <Field label="Reward name" value={reward.name} onChange={(event) => setReward({ ...reward, name: event.target.value })} />
            </div>
            <Field label="Discount (₹)" inputMode="decimal" value={reward.rupees} onChange={(event) => setReward({ ...reward, rupees: event.target.value })} />
            <Field label="Points cost" inputMode="numeric" value={reward.cost} onChange={(event) => setReward({ ...reward, cost: event.target.value })} />
            <Button type="submit" className="col-span-2" disabled={!reward.name.trim()}>{reward.id ? "Save reward" : "Add reward"}</Button>
          </form>
        </Card>
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Delivery queue</h2>
          <p className="text-xs text-muted">Billing never waits for this. Failed deliveries retry, and repeats do not double credit.</p>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {data.niroOutbox.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{row.kind} · {row.orderRef} · {money(row.amountP)}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted">{row.attempts} tries</span>
                  <Chip className={row.status === "done" ? "bg-olive" : row.status === "failed" ? "bg-pink" : "bg-mustard"}>{row.status}</Chip>
                </span>
              </li>
            ))}
            {data.niroOutbox.length === 0 && <li className="py-2 text-muted">Nothing queued.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

type ShopApp = "pos" | "kitchen" | "items" | "manager" | "captain";

// The owner runs every other app from here, with the admin session.
function ShopTab() {
  const [app, setApp] = useState<ShopApp>("pos");
  return (
    <>
      <PageTitle muted="Run the" strong="shop">
        <Segmented
          label="Which app"
          value={app}
          onChange={setApp}
          options={[
            { value: "pos", label: "Till" },
            { value: "kitchen", label: "Kitchen" },
            { value: "items", label: "Items" },
            { value: "manager", label: "Manager" },
            { value: "captain", label: "Captain" },
          ]}
        />
      </PageTitle>
      <HostProvider app="admin">
        {app === "pos" && <TillApp />}
        {app === "kitchen" && <KdsApp />}
        {app === "items" && <ItemsApp />}
        {app === "manager" && <ManagerApp />}
        {app === "captain" && <CaptainApp />}
      </HostProvider>
    </>
  );
}

function AuditTab({ data }: { data: AdminView }) {
  return (
    <>
      <PageTitle muted="Audit" strong="log" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-card">
          <p className="text-xs text-muted">Every action, newest first. This log cannot be switched off or edited from the app.</p>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {data.audit.map((row) => (
              <li key={row.id} className="py-2">
                <p className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{row.type.replaceAll("_", " ")}</span>
                  <span className="text-xs text-muted">{row.actor} ({row.role}) · {timeLabel(row.at)}</span>
                </p>
                <p className="text-xs break-all text-muted">{row.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="bg-card">
          <h2 className="text-lg font-semibold">Sign-ins</h2>
          <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
            {data.logins.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{row.staffName} <span className="text-xs text-muted">{row.app} · {timeLabel(row.at)}</span></span>
                {row.ok ? <Chip className="bg-olive">OK</Chip> : <Chip className="bg-pink">{row.detail}</Chip>}
              </li>
            ))}
            {data.logins.length === 0 && <li className="py-2 text-muted">No sign-ins yet.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

export function AdminApp() {
  const { data, me, offline, refresh } = useLive<AdminView>("/api/app/admin/view/admin", LOGIN, 3000);
  const [tab, setTab] = useState<TabId>("overview");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const act: Act = async (type, args = {}) => {
    setError("");
    setSaved(false);
    try {
      await sendCommand("admin", type, args);
      await refresh();
      setSaved(true);
      return true;
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
      return false;
    }
  };

  return (
    <AppFrame app="admin" tabs={TABS} active={tab} onTab={(next) => { setTab(next); setError(""); setSaved(false); }} me={me} offline={offline}>
      {!data ? (
        <Loading />
      ) : (
        <>
          {error && (
            <div className="sticky top-2 z-40 mb-3">
              <ErrorText>{error}</ErrorText>
            </div>
          )}
          {saved && !error && <p role="status" className="sticky top-2 z-10 mb-3 rounded-2xl bg-lime px-4 py-2 text-sm font-medium">Saved</p>}
          {tab === "overview" && <Overview data={data} onTab={setTab} />}
          {tab === "shop" && <ShopTab />}
          {tab === "menu" && <MenuTab data={data} act={act} />}
          {tab === "stock" && (
            <>
              <PageTitle muted="Stock" strong="room" />
              <StockPanel data={data} app="admin" onDone={refresh} />
            </>
          )}
          {tab === "staff" && <StaffTab data={data} act={act} />}
          {tab === "team" && (
            <>
              <PageTitle muted="Roster" strong="and clock" />
              <TeamPanel app="admin" loginPath={LOGIN} />
            </>
          )}
          {tab === "tables" && <TablesTab data={data} act={act} />}
          {tab === "settings" && <SettingsTab key={data.settings.shopName} data={data} act={act} />}
          {tab === "niro" && <NiroTab data={data} act={act} />}
          {tab === "reports" && (
            <>
              <PageTitle muted="Business" strong="reports" />
              <ReportPanel report={data.report} closes={data.closes} app="admin" />
            </>
          )}
          {tab === "audit" && <AuditTab data={data} />}
        </>
      )}
    </AppFrame>
  );
}
