"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CommandError, sendCommand, timeLabel, useLive } from "@/lib/client";
import { useHost } from "@/lib/client/host";
import type { ItemsView } from "@/lib/pos/views";
import { AppFrame } from "../AppFrame";
import { VegDot } from "../OrderPad";
import { Chip, EmptyState, ErrorText, Field, Loading, PageTitle, Segmented, Switch } from "../ui";

// One switch per item. On means customers and staff can order it; off hides it until switched back on.
export function ItemsApp() {
  const host = useHost("items");
  const { data, me, offline, refresh } = useLive<ItemsView>(`/api/app/${host.app}/view/items`, host.login, 3000);
  const [category, setCategory] = useState("all");
  const [show, setShow] = useState<"all" | "off">("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const [error, setError] = useState("");

  const items = useMemo(() => data?.items ?? [], [data]);
  const off = items.filter((item) => !item.on).length;
  const shown = useMemo(
    () =>
      items.filter(
        (item) => (category === "all" || item.categoryId === category) && (show === "all" || !item.on) && item.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [items, category, show, search],
  );

  const flip = async (id: string, on: boolean) => {
    setError("");
    setBusy((rows) => [...rows, id]);
    try {
      await sendCommand(host.app, "set_availability", { itemId: id, mode: on ? "available" : "indefinite" });
      await refresh();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    } finally {
      setBusy((rows) => rows.filter((row) => row !== id));
    }
  };

  return (
    <AppFrame app={host.app} tabs={[]} me={me} offline={offline}>
      {!data ? (
        <Loading />
      ) : (
        <>
          <PageTitle muted="Item" strong="switches">
            <Chip className={off ? "bg-pink" : "bg-lime"}>{off} off</Chip>
            <Chip className="bg-canvas">{items.length - off} on</Chip>
          </PageTitle>
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-3xl bg-card p-3">
            <div className="min-w-48 flex-1">
              <Field label="Search items" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Segmented
              label="Which items"
              value={show}
              onChange={setShow}
              options={[
                { value: "all", label: "All" },
                { value: "off", label: "Off only" },
              ]}
            />
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {[{ id: "all", name: "All items" }, ...data.categories].map((row) => (
              <button key={row.id} type="button" aria-pressed={category === row.id} onClick={() => setCategory(row.id)} className={`tap min-h-11 shrink-0 rounded-pill px-4 text-sm font-medium ${category === row.id ? "bg-ink text-white" : "bg-canvas"}`}>
                {row.name}
              </button>
            ))}
          </div>
          <ErrorText>{error}</ErrorText>
          {shown.length === 0 && (
            <EmptyState>
              <Search size={18} strokeWidth={1.5} className="mx-auto mb-2" aria-hidden />
              {show === "off" ? "Everything is on." : "No items match."}
            </EmptyState>
          )}
          <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {shown.map((item) => (
              <li key={item.id} className={`flex min-h-16 items-center justify-between gap-3 rounded-3xl px-4 py-2 ${item.on ? "bg-card" : "bg-pink"}`}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <VegDot veg={item.veg} />
                    <span className="truncate">{item.name}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-1 text-xs">
                    {!item.on && <Chip className="bg-card">{item.soldOut === "until" ? `Off until ${timeLabel(item.until ?? 0)}` : item.soldOut === "day" ? "Off for today" : "Off until switched on"}</Chip>}
                    {item.on && item.stockOut && <Chip className="bg-mustard">Ingredients out of stock</Chip>}
                  </p>
                </div>
                <Switch label={`${item.name} ${item.on ? "is on" : "is off"}`} checked={item.on} disabled={busy.includes(item.id)} onChange={(next) => flip(item.id, next)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </AppFrame>
  );
}
