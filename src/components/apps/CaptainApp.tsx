"use client";

import { Bell, ChefHat, Clock, LayoutGrid, ListChecks, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { speak, beep } from "@/lib/audio";
import { CommandError, minutesSince, sendCommand, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { CheckView, FloorView, TableState, TeamView } from "@/lib/pos/views";
import { useHost } from "@/lib/client/host";
import { AppFrame, type Tab } from "../AppFrame";
import { CheckoutPanel, LinesList } from "../CheckPanel";
import { OrderPad } from "../OrderPad";
import { SoundToggle } from "../SoundToggle";
import { Button, Card, Chip, Dashes, EmptyState, ErrorText, Field, Loading, PageTitle, Segmented, Sheet, Stat } from "../ui";
import { TeamPanel } from "./TeamPanel";

type TabId = "tables" | "orders" | "kitchen" | "shift";
const money = (paise: number) => formatRupees(paise / 100);

const TABS: Tab<TabId>[] = [
  { id: "tables", label: "Active tables", short: "Tables", icon: LayoutGrid },
  { id: "orders", label: "Live orders", short: "Orders", icon: ListChecks },
  { id: "kitchen", label: "Kitchen overview", short: "Kitchen", icon: ChefHat },
  { id: "shift", label: "Clock, roster and sign-ins", short: "Shift", icon: Clock },
];

export const TABLE_STATES: Record<TableState, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-card" },
  pending_qr: { label: "QR order waiting", className: "bg-pink" },
  seated: { label: "Seated", className: "bg-periwinkle" },
  kot_sent: { label: "KOT sent", className: "bg-mustard" },
  food_ready: { label: "Food ready", className: "bg-lime" },
  bill_requested: { label: "Bill requested", className: "bg-lilac" },
  paid_cooking: { label: "Paid, still serving", className: "bg-olive" },
};

function useReadyAlerts(checks: CheckView[] | undefined, sound: boolean) {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!checks) return;
    const ready = checks.flatMap((check) => check.lines.filter((line) => line.status === "ready").map((line) => ({ id: line.id, check })));
    if (seen.current && sound) {
      const fresh = new Map(ready.filter((row) => !seen.current!.has(row.id)).map((row) => [row.check.id, row.check]));
      for (const check of fresh.values()) {
        beep();
        speak(`${check.tableLabel}, order ${check.no} ready`);
      }
    }
    seen.current = new Set(ready.map((row) => row.id));
  }, [checks, sound]);
}

function MovePanel({ check, floor, onDone }: { check: CheckView; floor: FloorView; onDone: () => void }) {
  const host = useHost("captain");
  const [error, setError] = useState("");
  const [merge, setMerge] = useState<string | null>(null);
  const move = async (toTableId: string, withMerge: boolean) => {
    setError("");
    try {
      await sendCommand(host.app, "move_check", { checkId: check.id, toTableId, merge: withMerge });
      setMerge(null);
      onDone();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "Could not move the table");
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Choose where to move this check. The kitchen sees the new table. A merge can be undone from Live orders until a bill is issued.</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {floor.tables.filter((table) => table.id !== check.tableId).map((table) => (
          <li key={table.id}>
            <button
              type="button"
              onClick={() => (table.checkId ? setMerge(table.id) : move(table.id, false))}
              className={`tap flex min-h-16 w-full flex-col items-center justify-center rounded-2xl p-2 text-sm font-medium ${table.checkId ? "bg-mustard" : "bg-canvas hover:bg-lime"}`}
            >
              {table.label}
              <span className="text-xs font-normal">{table.checkId ? "Occupied" : "Free"}</span>
            </button>
          </li>
        ))}
      </ul>
      {merge && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-canvas p-3">
          <p className="min-w-0 flex-1 text-sm">{floor.tables.find((table) => table.id === merge)?.label} is occupied. Merge the two checks?</p>
          <Button onClick={() => move(merge, true)}>Merge checks</Button>
          <Button variant="ghost" onClick={() => setMerge(null)}>
            Back
          </Button>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

function TableSheet({
  tableId,
  checkId,
  floor,
  team,
  onClose,
  onDone,
  onOpened,
}: {
  tableId: string | null;
  checkId: string | null;
  floor: FloorView;
  team: TeamView | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
  onOpened: (checkId: string) => void;
}) {
  const host = useHost("captain");
  const check = floor.checks.find((row) => row.id === checkId) ?? null;
  const [view, setView] = useState<"order" | "check" | "checkout" | "move">(check ? "check" : "order");
  const [covers, setCovers] = useState(2);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const role = team?.me.role ?? undefined;
  const allowed = role !== "captain" || team?.me.canSettle;
  const title = check ? `${check.tableLabel} · Order ${check.no}` : tableId ? `New order · ${floor.tables.find((table) => table.id === tableId)?.label}` : "New takeaway";

  const act = async (type: string, args: unknown) => {
    setError("");
    try {
      await sendCommand(host.app, type, args);
      onDone();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };

  return (
    <Sheet title={title} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {check && (
          <Segmented
            label="Table actions"
            value={view}
            onChange={setView}
            options={[
              { value: "check", label: "Check" },
              { value: "order", label: "Add items" },
              { value: "checkout", label: "Checkout" },
              ...(check.tableId ? [{ value: "move" as const, label: "Move" }] : []),
            ]}
          />
        )}
        {check?.qrPending && (
          <div className="flex flex-col gap-2 rounded-2xl bg-pink p-3">
            <p className="text-sm font-medium">New QR order from this table. Check the guest is here, then accept it.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => act("qr_accept", { checkId: check.id })}>Accept and send to kitchen</Button>
              <Button variant="ghost" onClick={() => setRejecting(!rejecting)}>
                Reject
              </Button>
            </div>
            {rejecting && (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-40 flex-1">
                  <Field label="Reason shown in the log" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
                </div>
                <Button variant="soft" disabled={!rejectReason.trim()} onClick={() => act("qr_reject", { checkId: check.id, reason: rejectReason }).then(onClose)}>
                  Reject order
                </Button>
              </div>
            )}
          </div>
        )}
        <ErrorText>{error}</ErrorText>

        {view === "order" && (
          <>
            {!check && tableId && (
              <div className="w-28">
                <Field label="Guests" type="number" min={1} value={covers} onChange={(event) => setCovers(Number(event.target.value))} />
              </div>
            )}
            <OrderPad
              menu={floor.menu}
              allowHold
              onSubmit={async (items) => {
                const { checkId: id } = await sendCommand<{ checkId: string }>(host.app, "send_items", { checkId: check?.id, tableId, covers, items, channel: tableId ? "dine_in" : "takeaway" });
                await onDone();
                onOpened(id);
                setView("check");
              }}
            />
          </>
        )}
        {view === "check" && check && (
          <>
            <LinesList check={check} app={host.app} role={role} reasons={floor.reasons} onDone={onDone} />
            <div className="flex flex-wrap gap-2">
              {check.lines.some((line) => line.status === "held") && <Button variant="soft" onClick={() => act("fire_held", { checkId: check.id })}>Fire held items</Button>}
              {check.lines.some((line) => line.status === "ready") && <Button variant="lime" onClick={() => act("serve_check", { checkId: check.id })}>Mark all ready items served</Button>}
              {!check.billRequested && <Button variant="soft" onClick={() => act("request_bill", { checkId: check.id })}>Request bill</Button>}
              {check.waiterCalled && <Button variant="soft" onClick={() => act("clear_waiter_call", { checkId: check.id })}>Guest attended</Button>}
            </div>
          </>
        )}
        {view === "checkout" && check &&
          (allowed ? (
            <CheckoutPanel app={host.app} check={check} reasons={floor.reasons} role={role} canDiscount={false} canCorrect={false} rewards={undefined} onDone={onDone} />
          ) : (
            <EmptyState>Table checkout is not switched on for you. Tap Request bill, or ask the owner to allow it.</EmptyState>
          ))}
        {view === "move" && check && (
          <MovePanel
            check={check}
            floor={floor}
            onDone={() => {
              onDone();
              onClose();
            }}
          />
        )}
      </div>
    </Sheet>
  );
}

function statusDashes(check: CheckView) {
  const live = check.lines.filter((line) => !["void", "held", "awaiting"].includes(line.status));
  const done = live.filter((line) => ["ready", "served", "comp"].includes(line.status)).length;
  return { done, total: Math.max(live.length, 1) };
}

export function KitchenOverview({ floor }: { floor: FloorView }) {
  if (floor.kitchen.length === 0) return <EmptyState>The kitchen has nothing open.</EmptyState>;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {floor.stations.map((station) => (
        <Card key={station.id} className="bg-card">
          <h2 className="text-lg font-semibold">{station.name}</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {floor.kitchen.filter((kot) => kot.stationId === station.id).map((kot) => (
              <li key={kot.id} className="rounded-2xl bg-canvas p-3">
                <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {kot.tableLabel} · KOT {kot.no}
                  <Chip className="bg-card">{minutesSince(kot.at, floor.now)} min</Chip>
                </p>
                <ul className="mt-1 text-sm">
                  {kot.lines.map((line) => (
                    <li key={line.id} className={line.status === "void" ? "text-muted line-through" : ""}>
                      {line.qty} x {line.name} <span className="text-xs text-muted">({line.status})</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

export function CaptainApp() {
  const host = useHost("captain");
  const { data: floor, me, offline, refresh } = useLive<FloorView>(`/api/app/${host.app}/view/floor`, host.login);
  const { data: team } = useLive<TeamView>(`/api/app/${host.app}/view/team`, host.login, 5000);
  const [tab, setTab] = useState<TabId>("tables");
  const [open, setOpen] = useState<{ tableId: string | null; checkId: string | null } | null>(null);
  const [sound, setSound] = useState(false);
  const [error, setError] = useState("");
  useReadyAlerts(floor?.checks, sound);

  return (
    <AppFrame app={host.app} tabs={TABS} active={tab} onTab={setTab} me={me} offline={offline}>
      {!floor ? (
        <Loading />
      ) : (
        <>
          {tab === "tables" && (
            <>
              <PageTitle muted="Active" strong="tables">
                <SoundToggle enabled={sound} onChange={setSound} />
                <Button variant="soft" className="bg-card" onClick={() => setOpen({ tableId: null, checkId: null })}>
                  <ShoppingBag size={18} strokeWidth={1.5} aria-hidden />
                  Takeaway
                </Button>
              </PageTitle>
              {team && !team.myClock && (
                <p className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mustard px-4 py-2 text-sm font-medium">
                  You are not clocked in.
                  <Button
                    onClick={() =>
                      sendCommand(host.app, "clock_in")
                        .then(refresh)
                        .catch((problem) => setError(problem.message))
                    }
                  >
                    Clock in
                  </Button>
                </p>
              )}
              <ErrorText>{error}</ErrorText>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {floor.tables.map((table) => (
                  <li key={table.id}>
                    <button
                      type="button"
                      onClick={() => setOpen({ tableId: table.id, checkId: table.checkId })}
                      className={`tap flex min-h-32 w-full flex-col justify-between rounded-3xl p-4 text-left ${TABLE_STATES[table.state].className}`}
                    >
                      <span className="flex items-start justify-between gap-1">
                        <span className="text-2xl font-bold">{table.label}</span>
                        {table.waiterCalled && <Bell size={18} strokeWidth={2} aria-label="Guest is calling" />}
                      </span>
                      <span className="text-xs font-medium">{TABLE_STATES[table.state].label}</span>
                      {table.checkId && (
                        <span className="flex justify-between gap-1 text-xs">
                          <span>
                            {table.openedAt ? `${minutesSince(table.openedAt, floor.now)} min` : ""} · {table.itemCount} items
                          </span>
                          <span className="font-semibold">{money(table.amountP)}</span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "orders" && (
            <>
              <PageTitle muted="Live" strong="orders" />
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Open checks" value={floor.checks.length} />
                <Stat label="Food ready" value={floor.tables.filter((table) => table.state === "food_ready").length} className="bg-lime" />
                <Stat label="Bills requested" value={floor.tables.filter((table) => table.state === "bill_requested").length} className="bg-lilac" />
                <Stat label="QR waiting" value={floor.tables.filter((table) => table.state === "pending_qr").length} className="bg-pink" />
              </div>
              {floor.checks.length === 0 && <EmptyState>No open orders.</EmptyState>}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {floor.checks.map((check) => {
                  const progress = statusDashes(check);
                  return (
                    <li key={check.id}>
                      <button type="button" onClick={() => setOpen({ tableId: check.tableId, checkId: check.id })} className="tap flex w-full flex-col gap-2 rounded-3xl bg-card p-4 text-left">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold">
                            {check.tableLabel} · {check.no}
                          </span>
                          <span className="text-sm font-semibold">{money(check.preview.totalP)}</span>
                        </span>
                        <span className="text-xs text-muted">{check.lines.filter((line) => line.status !== "void").map((line) => `${line.qty} ${line.name}`).join(", ")}</span>
                        <Dashes count={progress.done} total={progress.total} />
                        <span className="flex justify-between text-xs">
                          <span>{check.captain || check.channel}</span>
                          <span>{minutesSince(check.openedAt, floor.now)} min</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {floor.undoableMerges.length > 0 && (
                <Card className="mt-4 bg-card">
                  <h2 className="text-lg font-semibold">Merged checks</h2>
                  <ul className="mt-2 flex flex-col gap-2">
                    {floor.undoableMerges.map((row) => (
                      <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          Order {row.no} from {row.tableLabel}
                        </span>
                        <Button
                          variant="soft"
                          onClick={() =>
                            sendCommand(host.app, "undo_merge", { checkId: row.id })
                              .then(refresh)
                              .catch((problem) => setError(problem.message))
                          }
                        >
                          Undo merge
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <ErrorText>{error}</ErrorText>
                </Card>
              )}
            </>
          )}

          {tab === "kitchen" && (
            <>
              <PageTitle muted="Kitchen" strong="overview" />
              <KitchenOverview floor={floor} />
            </>
          )}

          {tab === "shift" && (
            <>
              <PageTitle muted="My" strong="shift" />
              <TeamPanel app={host.app} loginPath={host.login} />
            </>
          )}

          {open && (
            <TableSheet
              key={open.tableId ?? open.checkId ?? "takeaway"}
              tableId={open.tableId}
              checkId={open.checkId}
              floor={floor}
              team={team}
              onClose={() => setOpen(null)}
              onDone={refresh}
              onOpened={(checkId) => setOpen((current) => (current ? { ...current, checkId } : current))}
            />
          )}
        </>
      )}
    </AppFrame>
  );
}
