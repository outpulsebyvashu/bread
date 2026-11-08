"use client";

import { History, Plus, ReceiptText, Wallet } from "lucide-react";
import { useState } from "react";
import { CommandError, minutesSince, sendCommand, timeLabel, toPaise, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { TillView } from "@/lib/pos/views";
import { ApprovalSheet } from "../ApprovalSheet";
import { useHost } from "@/lib/client/host";
import { AppFrame, type Tab } from "../AppFrame";
import { BillCard, CheckoutPanel, LinesList } from "../CheckPanel";
import { OrderPad } from "../OrderPad";
import { SoundToggle } from "../SoundToggle";
import { Button, Card, Chip, EmptyState, ErrorText, Field, Loading, PageTitle, Segmented, SelectField, Sheet } from "../ui";

type TabId = "bills" | "recent" | "shift";
const money = (paise: number) => formatRupees(paise / 100);

const TABS: Tab<TabId>[] = [
  { id: "bills", label: "Bill queue", short: "Bills", icon: ReceiptText },
  { id: "recent", label: "Issued bills", short: "Issued", icon: History },
  { id: "shift", label: "Cash shift", short: "Shift", icon: Wallet },
];

function ShiftGate({ onDone }: { onDone: () => void }) {
  const host = useHost("pos");
  const [float, setFloat] = useState("");
  const [error, setError] = useState("");
  return (
    <Card className="mb-4 bg-mustard">
      <h2 className="text-lg font-semibold">Open your cash shift</h2>
      <p className="mb-3 text-sm">Count the opening cash. You need an open shift to take payments.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-32 flex-1 sm:max-w-48">
          <Field label="Opening float (₹)" inputMode="decimal" value={float} onChange={(event) => setFloat(event.target.value)} />
        </div>
        <Button
          disabled={float === ""}
          onClick={() =>
            sendCommand(host.app, "open_shift", { floatP: toPaise(float) })
              .then(onDone)
              .catch((problem) => setError(problem.message))
          }
        >
          Open shift
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}

function ShiftPanel({ data, onDone }: { data: TillView; onDone: () => void }) {
  const host = useHost("pos");
  const [kind, setKind] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const [closed, setClosed] = useState<{ expectedP: number; varianceP: number } | null>(null);

  const close = async (approval?: { reason: string; pin?: string }) => {
    const result = await sendCommand<{ expectedP: number; varianceP: number }>(host.app, "close_shift", { countedP: toPaise(counted), note, approval });
    setClosed(result);
    setCounted("");
    onDone();
  };

  return (
    <div className="flex flex-col gap-4">
      {closed && (
        <Card className="bg-lime">
          <h2 className="text-lg font-semibold">Shift closed</h2>
          <p className="text-sm">
            Expected {money(closed.expectedP)}. Difference {money(closed.varianceP)}.
          </p>
        </Card>
      )}
      {!data.shift ? (
        !closed && <ShiftGate onDone={onDone} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="bg-card">
            <h2 className="text-lg font-semibold">Cash in and out</h2>
            <p className="text-sm text-muted">
              Opened {timeLabel(data.shift.openedAt)} with {money(data.shift.floatP)}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Segmented label="Direction" value={kind} onChange={setKind} options={[{ value: "out", label: "Cash out" }, { value: "in", label: "Cash in" }]} />
              <Field label="Amount (₹)" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <Field label="What for" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Button
                disabled={!amount || !reason.trim()}
                onClick={() =>
                  sendCommand(host.app, "cash_move", { kind, amountP: toPaise(amount), reason })
                    .then(() => {
                      setAmount("");
                      setReason("");
                      onDone();
                    })
                    .catch((problem) => setError(problem.message))
                }
              >
                Record
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-dashed divide-hairline text-sm">
              {data.shift.moves.map((move) => (
                <li key={move.id} className="flex justify-between gap-2 py-2">
                  <span>{move.reason}</span>
                  <span>
                    {move.kind === "in" ? "+" : "-"}
                    {money(move.amountP)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="bg-card">
            <h2 className="text-lg font-semibold">Close shift</h2>
            <p className="mb-3 text-sm text-muted">Count the drawer first. The expected amount appears after you submit.</p>
            <div className="flex flex-col gap-3">
              <Field label="Cash counted (₹)" inputMode="decimal" value={counted} onChange={(event) => setCounted(event.target.value)} />
              <Field label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
              <Button
                disabled={counted === ""}
                onClick={async () => {
                  setError("");
                  try {
                    await close();
                  } catch (problem) {
                    if (problem instanceof CommandError && problem.code === "variance_approval") setAsking(true);
                    else setError(problem instanceof CommandError ? problem.message : "That did not work");
                  }
                }}
              >
                Close shift
              </Button>
            </div>
          </Card>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      {asking && (
        <ApprovalSheet
          title="Cash is off by more than the limit"
          detail="A manager must approve this difference."
          reasons={["Count checked twice", "Change given wrongly", "Other"]}
          role="cashier"
          onSubmit={close}
          onClose={() => setAsking(false)}
        />
      )}
    </div>
  );
}

function NewOrderSheet({ data, onClose, onDone, onOpened }: { data: TillView; onClose: () => void; onDone: () => void; onOpened: (id: string) => void }) {
  const host = useHost("pos");
  const [tableId, setTableId] = useState("");
  const free = data.tables.filter((table) => table.state === "free");
  return (
    <Sheet title="New order" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="max-w-xs">
          <SelectField label="Where" value={tableId} onChange={(event) => setTableId(event.target.value)}>
            <option value="">Takeaway or counter</option>
            {free.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label}
              </option>
            ))}
          </SelectField>
        </div>
        <OrderPad
          menu={data.menu}
          allowHold
          onSubmit={async (items) => {
            const { checkId } = await sendCommand<{ checkId: string }>(host.app, "send_items", { tableId: tableId || null, channel: tableId ? "dine_in" : "takeaway", items });
            onDone();
            onOpened(checkId);
          }}
        />
      </div>
    </Sheet>
  );
}

export function TillApp() {
  const host = useHost("pos");
  const { data, me, offline, refresh } = useLive<TillView>(`/api/app/${host.app}/view/till`, host.login);
  const [tab, setTab] = useState<TabId>("bills");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"checkout" | "items" | "add">("checkout");
  const [creating, setCreating] = useState(false);
  const [sound, setSound] = useState(false);
  const [error, setError] = useState("");

  const queue = (data?.checks ?? []).slice().sort((a, b) => Number(b.billRequested) - Number(a.billRequested) || Number(b.qrPending) - Number(a.qrPending) || b.openedAt - a.openedAt);
  const check = data?.checks.find((row) => row.id === openId) ?? null;

  const act = async (type: string, args: unknown) => {
    setError("");
    try {
      await sendCommand(host.app, type, args);
      await refresh();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };

  return (
    <AppFrame app={host.app} tabs={TABS} active={tab} onTab={setTab} me={me} offline={offline}>
      {!data ? (
        <Loading />
      ) : (
        <>
          {tab === "bills" && (
            <>
              <PageTitle muted="Bill" strong="queue">
                <SoundToggle enabled={sound} onChange={setSound} />
                <Button onClick={() => setCreating(true)}>
                  <Plus size={18} strokeWidth={1.5} aria-hidden />
                  New order
                </Button>
              </PageTitle>
              {!data.shift && <ShiftGate onDone={refresh} />}
              <ErrorText>{error}</ErrorText>
              {queue.length === 0 && <EmptyState>No open bills.</EmptyState>}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {queue.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(row.id);
                        setView("checkout");
                      }}
                      className={`tap flex w-full flex-col gap-2 rounded-3xl p-4 text-left ${row.billRequested ? "bg-lilac" : row.qrPending ? "bg-pink" : "bg-card"}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-lg font-semibold">{row.tableLabel}</span>
                        <span className="text-lg font-bold">{money(row.preview.totalP + row.bills.filter((bill) => bill.status === "issued").reduce((sum, bill) => sum + bill.totalP - bill.paidP, 0))}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1 text-xs">
                        Order {row.no} · {minutesSince(row.openedAt, data.now)} min
                        {row.billRequested && <Chip className="bg-card">Bill requested</Chip>}
                        {row.qrPending && <Chip className="bg-card">QR waiting</Chip>}
                        {row.bills.some((bill) => bill.status === "issued" && !bill.paid) && <Chip className="bg-mustard">Billed, unpaid</Chip>}
                        {row.channel === "qr" && <Chip className="bg-canvas">QR</Chip>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {tab === "recent" && (
            <>
              <PageTitle muted="Issued" strong="bills" />
              {data.recentBills.length === 0 && <EmptyState>No bills yet today.</EmptyState>}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {data.recentBills.map((bill) => (
                  <div key={bill.id} className="rounded-3xl bg-card p-2">
                    <BillCard app={host.app} bill={bill} payments={data.payments.filter((payment) => payment.billId === bill.id)} reasons={data.reasons} role={me?.role} canCorrect={bill.docType !== "credit_note"} onDone={refresh} />
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "shift" && (
            <>
              <PageTitle muted="Cash" strong="shift" />
              <ShiftPanel data={data} onDone={refresh} />
            </>
          )}

          {check && (
            <Sheet title={`${check.tableLabel} · Order ${check.no}`} onClose={() => setOpenId(null)} wide>
              <div className="flex flex-col gap-4">
                {check.qrPending && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-pink p-3">
                    <p className="min-w-0 flex-1 text-sm font-medium">QR order waiting to be accepted.</p>
                    <Button onClick={() => act("qr_accept", { checkId: check.id })}>Accept</Button>
                    <Button variant="ghost" onClick={() => act("qr_reject", { checkId: check.id, reason: "Rejected at the till" }).then(() => setOpenId(null))}>
                      Reject
                    </Button>
                  </div>
                )}
                <Segmented
                  label="Check view"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "checkout", label: "Checkout" },
                    { value: "items", label: "Items" },
                    { value: "add", label: "Add items" },
                  ]}
                />
                {view === "checkout" && <CheckoutPanel app={host.app} check={check} reasons={data.reasons} role={me?.role} rewards={data.rewards} canDiscount canCorrect onDone={refresh} />}
                {view === "items" && <LinesList check={check} app={host.app} role={me?.role} reasons={data.reasons} onDone={refresh} />}
                {view === "add" && (
                  <OrderPad
                    menu={data.menu}
                    allowHold
                    onSubmit={async (items) => {
                      await sendCommand(host.app, "send_items", { checkId: check.id, items });
                      setView("items");
                      await refresh();
                    }}
                  />
                )}
              </div>
            </Sheet>
          )}
          {creating && (
            <NewOrderSheet
              data={data}
              onClose={() => setCreating(false)}
              onDone={refresh}
              onOpened={(id) => {
                setCreating(false);
                setOpenId(id);
                setView("checkout");
              }}
            />
          )}
        </>
      )}
    </AppFrame>
  );
}
