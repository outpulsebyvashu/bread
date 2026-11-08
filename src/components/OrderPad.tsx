"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CommandError } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { CartItem } from "@/lib/pos/types";
import type { MenuView } from "@/lib/pos/views";
import { Button, Chip, ErrorText, Field, IconButton, Sheet } from "./ui";

type MenuItem = MenuView["items"][number];
type CartRow = CartItem & { key: number; name: string; unitP: number; mods: string[] };

export function VegDot({ veg }: { veg: boolean }) {
  return (
    <span title={veg ? "Vegetarian" : "Non-vegetarian"} className={`flex size-4 shrink-0 items-center justify-center rounded border ${veg ? "border-green-700" : "border-red-800"}`}>
      <span className={`size-2 rounded-full ${veg ? "bg-green-700" : "bg-red-800"}`} />
      <span className="sr-only">{veg ? "Vegetarian" : "Non-vegetarian"}</span>
    </span>
  );
}

function OptionsSheet({ item, onAdd, onClose }: { item: MenuItem; onAdd: (ids: string[], note: string, qty: number) => void; onClose: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);

  const toggle = (group: MenuItem["groups"][number], id: string) => {
    const inGroup = group.options.map((option) => option.id);
    setChosen((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      const others = current.filter((value) => !inGroup.includes(value));
      const mine = current.filter((value) => inGroup.includes(value));
      if (group.max === 1) return [...others, id];
      return mine.length >= group.max ? current : [...current, id];
    });
  };

  const ready = item.groups.every((group) => chosen.filter((id) => group.options.some((option) => option.id === id)).length >= group.min);
  const unit = item.priceP + item.groups.flatMap((group) => group.options).filter((option) => chosen.includes(option.id)).reduce((sum, option) => sum + option.priceP, 0);

  return (
    <Sheet title={item.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {item.groups.map((group) => (
          <fieldset key={group.id}>
            <legend className="mb-2 text-sm font-medium">
              {group.name} <span className="font-normal text-muted">{group.min > 0 ? "Required" : `Up to ${group.max}`}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={!option.available}
                  aria-pressed={chosen.includes(option.id)}
                  onClick={() => toggle(group, option.id)}
                  className={`tap min-h-11 rounded-pill px-4 text-sm disabled:line-through disabled:opacity-50 ${chosen.includes(option.id) ? "bg-ink text-white" : "bg-canvas"}`}
                >
                  {option.name}
                  {option.priceP > 0 && ` +${formatRupees(option.priceP / 100)}`}
                  {!option.available && " (sold out)"}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <Field label="Note for the kitchen" value={note} maxLength={140} onChange={(event) => setNote(event.target.value)} />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconButton icon={Minus} label="One less" className="bg-canvas hover:bg-lime" disabled={qty <= 1} onClick={() => setQty(qty - 1)} />
            <span className="w-6 text-center font-semibold">{qty}</span>
            <IconButton icon={Plus} label="One more" className="bg-canvas hover:bg-lime" disabled={qty >= 99} onClick={() => setQty(qty + 1)} />
          </div>
          <Button disabled={!ready} onClick={() => onAdd(chosen, note, qty)}>
            Add {formatRupees((unit * qty) / 100)}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

// Menu grid and cart. Prices here are display only: the server recomputes everything on submit.
export function OrderPad({
  menu,
  submitLabel = "Send to kitchen",
  allowHold = false,
  onSubmit,
}: {
  menu: MenuView;
  submitLabel?: string;
  allowHold?: boolean;
  onSubmit: (items: CartItem[]) => Promise<unknown>;
}) {
  const [category, setCategory] = useState(menu.categories[0]?.id ?? "");
  const [picking, setPicking] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [counter, setCounter] = useState(0);

  const items = useMemo(() => menu.items.filter((item) => item.categoryId === category), [menu.items, category]);
  const total = cart.reduce((sum, row) => sum + row.unitP * row.qty, 0);
  const count = cart.reduce((sum, row) => sum + row.qty, 0);
  const cartPanel = useRef<HTMLElement>(null);
  const inCart = (itemId: string) => cart.reduce((sum, row) => sum + (row.itemId === itemId ? row.qty : 0), 0);

  const add = (item: MenuItem, ids: string[], note: string, qty: number) => {
    const options = item.groups.flatMap((group) => group.options).filter((option) => ids.includes(option.id));
    const same = !ids.length && !note ? cart.find((row) => row.itemId === item.id && !row.modifierIds?.length && !row.note && !row.hold) : undefined;
    setPicking(null);
    setError("");
    if (same) {
      setCart((current) => current.map((row) => (row.key === same.key ? { ...row, qty: Math.min(99, row.qty + qty) } : row)));
      return;
    }
    setCounter((value) => value + 1);
    setCart((current) => [
      ...current,
      {
        key: counter,
        itemId: item.id,
        qty,
        modifierIds: ids,
        note,
        hold: false,
        name: item.name,
        mods: options.map((option) => option.name),
        unitP: item.priceP + options.reduce((sum, option) => sum + option.priceP, 0),
      },
    ]);
  };

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      await onSubmit(cart.map(({ itemId, qty, modifierIds, note, hold }) => ({ itemId, qty, modifierIds, note, hold })));
      setCart([]);
    } catch (problem) {
      // The cart stays, so a sold-out item never loses the rest of the order.
      setError(problem instanceof CommandError ? problem.message : "Could not send the order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {menu.categories.map((row) => (
            <button
              key={row.id}
              type="button"
              aria-pressed={category === row.id}
              onClick={() => setCategory(row.id)}
              className={`tap min-h-11 shrink-0 rounded-pill px-4 text-sm font-medium ${category === row.id ? "bg-ink text-white" : "bg-canvas"}`}
            >
              {row.name}
            </button>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={!item.available}
                onClick={() => (item.groups.length ? setPicking(item) : add(item, [], "", 1))}
                className="tap flex min-h-24 w-full flex-col justify-between gap-2 rounded-3xl bg-canvas p-3 text-left hover:bg-lime disabled:opacity-50 disabled:hover:bg-canvas"
              >
                <span className="flex items-start gap-1.5 text-sm font-medium">
                  <span className="mt-0.5">
                    <VegDot veg={item.veg} />
                  </span>
                  {item.name}
                </span>
                <span className="flex items-center justify-between gap-1 text-sm">
                  {item.available ? formatRupees(item.priceP / 100) : <Chip className="bg-pink">Sold out</Chip>}
                  {inCart(item.id) > 0 && <Chip className="bg-ink text-white">{inCart(item.id)} in cart</Chip>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside ref={cartPanel} className="flex scroll-mt-4 flex-col gap-3 rounded-3xl bg-canvas p-4">
        <h3 className="font-semibold">Cart</h3>
        {cart.length === 0 && <p className="text-sm text-muted">Tap items to add them.</p>}
        <ul className="flex flex-col gap-2">
          {cart.map((row) => (
            <li key={row.key} className="rounded-2xl bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-medium">
                  {row.qty} x {row.name}
                  {row.mods.length > 0 && <span className="block text-xs font-normal text-muted">{row.mods.join(", ")}</span>}
                  {row.note && <span className="block text-xs font-normal text-muted">Note: {row.note}</span>}
                </p>
                <span className="shrink-0 text-sm">{formatRupees((row.unitP * row.qty) / 100)}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <IconButton icon={Minus} label={`One less ${row.name}`} className="bg-canvas hover:bg-lime" onClick={() => setCart((current) => current.map((entry) => (entry.key === row.key ? { ...entry, qty: Math.max(1, entry.qty - 1) } : entry)))} />
                <IconButton icon={Plus} label={`One more ${row.name}`} className="bg-canvas hover:bg-lime" onClick={() => setCart((current) => current.map((entry) => (entry.key === row.key ? { ...entry, qty: Math.min(99, entry.qty + 1) } : entry)))} />
                <IconButton icon={Trash2} label={`Remove ${row.name}`} className="bg-canvas hover:bg-lime" onClick={() => setCart((current) => current.filter((entry) => entry.key !== row.key))} />
                {allowHold && (
                  <button
                    type="button"
                    aria-pressed={!!row.hold}
                    onClick={() => setCart((current) => current.map((entry) => (entry.key === row.key ? { ...entry, hold: !entry.hold } : entry)))}
                    className={`tap ml-auto min-h-11 rounded-pill px-3 text-xs font-medium ${row.hold ? "bg-mustard" : "bg-canvas"}`}
                  >
                    {row.hold ? "On hold" : "Hold"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <ErrorText>{error}</ErrorText>
        <Button disabled={cart.length === 0 || busy} onClick={send}>
          {submitLabel}
          {cart.length > 0 && ` · ${formatRupees(total / 100)}`}
        </Button>
        {cart.length > 0 && <p className="text-center text-xs text-muted">Before tax. The bill shows the final total.</p>}
      </aside>

      {picking && <OptionsSheet item={picking} onAdd={(ids, note, qty) => add(picking, ids, note, qty)} onClose={() => setPicking(null)} />}
    </div>
    {cart.length > 0 && (
      <div className="sticky bottom-0 z-10 mt-3 flex items-center gap-2 rounded-pill bg-ink p-1.5 text-white lg:hidden">
        <button type="button" onClick={() => cartPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="tap min-h-11 min-w-0 flex-1 rounded-pill px-3 text-left text-sm font-medium">
          View cart · {count} · {formatRupees(total / 100)}
        </button>
        <Button variant="lime" disabled={busy} onClick={send}>
          {submitLabel}
        </Button>
      </div>
    )}
    </div>
  );
}
