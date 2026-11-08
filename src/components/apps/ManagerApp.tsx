"use client";

import { BarChart3, ClipboardCheck, Clock, Moon, Package, Radio } from "lucide-react";
import { useState } from "react";
import { CommandError, minutesSince, sendCommand, timeLabel, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { ManagerView } from "@/lib/pos/views";
import { useHost } from "@/lib/client/host";
import type { AppId } from "@/lib/roles";
import { AppFrame, type Tab } from "../AppFrame";
import { ReportPanel } from "../ReportPanel";
import { Button, Card, Chip, Dashes, EmptyState, ErrorText, Field, Loading, PageTitle, Segmented, SelectField, Stat } from "../ui";
import { TeamPanel } from "./TeamPanel";

type TabId = "floor" | "review" | "stock" | "reports" | "close" | "team";
const money = (paise: number) => formatRupees(paise / 100);

const TABS: Tab<TabId>[] = [
  { id: "floor", label: "Live floor", short: "Floor", icon: Radio },
  { id: "review", label: "Approvals and UPI", short: "Approvals", icon: ClipboardCheck },
  { id: "stock", label: "Stock", icon: Package },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "close", label: "Day close", short: "Close", icon: Moon },
  { id: "team", label: "Team and roster", short: "Team", icon: Clock },
];

export function StockPanel({ data, app, onDone }: { data: Pick<ManagerView, "ingredients" | "stockMoves">; app: AppId; onDone: () => void }) {
  const [ingredientId, setIngredientId] = useState("");
  const [kind, setKind] = useState<"receive" | "adjust" | "waste">("receive");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const ingredient = data.ingredients.find((row) => row.id === ingredientId);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="bg-card">
        <h2 className="text-lg font-semibold">Stock levels</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {data.ingredients.map((row) => {
            const target = Math.max(row.lowAt * 2, 1);
            return (
              <li key={row.id} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {row.name} {row.stock <= row.lowAt && <Chip className="bg-pink">Low</Chip>}
                  </span>
                  <span>
                    {row.stock} {row.unit}
                  </span>
                </span>
                <Dashes count={Math.min(10, Math.round((row.stock / target) * 10))} total={10} />
              </li>
            );
          })}
        </ul>
      </Card>
      <Card className="bg-periwinkle">
        <h2 className="text-lg font-semibold">Stock entry</h2>
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              await sendCommand(app, "stock_move", { ingredientId, kind, qty: Number(qty), reason });
              setQty("");
              setReason("");
              onDone();
            } catch (problem) {
              setError(problem instanceof CommandError ? problem.message : "That did not work");
            }
          }}
        >
          <SelectField label="Ingredient" value={ingredientId} onChange={(event) => setIngredientId(event.target.value)}>
            <option value="">Choose</option>
            {data.ingredients.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </SelectField>
          <Segmented label="Entry type" value={kind} onChange={setKind} options={[{ value: "receive", label: "Receive" }, { value: "waste", label: "Waste" }, { value: "adjust", label: "Adjust" }]} />
          <Field label={`Quantity${ingredient ? ` (${ingredient.unit})` : ""}`} inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} hint={kind === "adjust" ? "Use a minus for less, for example -2." : undefined} />
          <Field label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={!ingredientId || !qty || !reason.trim()}>
            Save entry
          </Button>
        </form>
      </Card>
      <Card className="bg-card lg:col-span-2">
        <h2 className="text-lg font-semibold">Stock history</h2>
        <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
          {data.stockMoves.map((move) => (
            <li key={move.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {data.ingredients.find((row) => row.id === move.ingredientId)?.name}: {move.delta > 0 ? "+" : ""}
                {move.delta} · {move.reason}
              </span>
              <span className="text-muted">
                {move.kind} · {move.actor} · {timeLabel(move.at)}
              </span>
            </li>
          ))}
          {data.stockMoves.length === 0 && <li className="py-2 text-muted">No entries yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

export function ManagerApp() {
  const host = useHost("manager");
  const { data, me, offline, refresh } = useLive<ManagerView>(`/api/app/${host.app}/view/manager`, host.login);
  const [tab, setTab] = useState<TabId>("floor");
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});

  const act = async (type: string, args: unknown = {}) => {
    setError("");
    try {
      await sendCommand(host.app, type, args);
      await refresh();
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
    }
  };

  return (
    <AppFrame
      app={host.app}
      tabs={TABS}
      active={tab}
      onTab={setTab}
      me={me}
      offline={offline}
    >
      {!data ? (
        <Loading />
      ) : (
        <>
          <ErrorText>{error}</ErrorText>
          {tab === "floor" && (
            <>
              <PageTitle muted="Live" strong="floor" />
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Open checks" value={data.floor.openChecks.length} />
                <Stat label="Billed today" value={money(data.report.totalP)} className="bg-lilac" />
                <Stat label="Unpaid bills" value={data.floor.openChecks.flatMap((check) => check.bills).filter((bill) => bill.status === "issued" && !bill.paid).length} className="bg-mustard" />
                <Stat label="Ticket time" value={data.report.ticketMinutes} unit="min" />
              </div>
              {data.floor.openChecks.length === 0 && <EmptyState>Nothing open.</EmptyState>}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...data.floor.openChecks].sort((a, b) => a.openedAt - b.openedAt).map((check) => (
                  <li key={check.id} className={`flex flex-col gap-1 rounded-3xl p-4 ${minutesSince(check.openedAt, data.now) >= 30 ? "bg-pink" : "bg-card"}`}>
                    <p className="flex justify-between gap-2 font-semibold">
                      {check.tableLabel} · {check.no}
                      <span>{money(check.preview.totalP)}</span>
                    </p>
                    <p className="text-xs">
                      Waiting {minutesSince(check.openedAt, data.now)} min · {check.captain || check.channel}
                    </p>
                    <p className="text-xs text-muted">{check.lines.filter((line) => line.status !== "void").map((line) => `${line.qty} ${line.name}: ${line.status}`).join(", ")}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {tab === "review" && (
            <>
              <PageTitle muted="Approvals" strong="and UPI" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="bg-card">
                  <h2 className="text-lg font-semibold">UPI to check</h2>
                  <ul className="mt-2 flex flex-col gap-2">
                    {data.upi.map((payment) => (
                      <li key={payment.id} className="flex flex-col gap-2 rounded-2xl bg-canvas p-3 text-sm">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {money(payment.amountP)} · {payment.billNo}
                          </span>
                          <Chip className={payment.status === "unmatched" ? "bg-pink" : "bg-mustard"}>{payment.status === "unmatched" ? "Credit with no bill" : payment.status === "pending" ? "Waiting" : "Marked by staff"}</Chip>
                        </span>
                        <span className="text-xs text-muted">
                          {payment.actor} · {payment.reason || "No reason"} · {payment.ref || "No reference"}
                        </span>
                        {payment.status === "confirmed" && (
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="min-w-40 flex-1">
                              <Field label="UTR from the bank statement" value={counts[payment.id] ?? ""} onChange={(event) => setCounts({ ...counts, [payment.id]: event.target.value })} />
                            </div>
                            <Button variant="soft" className="bg-card" onClick={() => act("upi_verify", { paymentId: payment.id, ref: counts[payment.id] })}>
                              Matched
                            </Button>
                          </div>
                        )}
                        {payment.status === "unmatched" && (
                          <Button variant="soft" className="bg-card" onClick={() => act("upi_resolve_unmatched", { paymentId: payment.id })}>
                            Refunded to the guest
                          </Button>
                        )}
                      </li>
                    ))}
                    {data.upi.length === 0 && <li className="text-sm text-muted">Nothing to check.</li>}
                  </ul>
                </Card>
                <Card className="bg-card">
                  <h2 className="text-lg font-semibold">Approval log</h2>
                  <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
                    {data.approvals.map((row) => (
                      <li key={row.id} className="py-2">
                        <p className="flex flex-wrap justify-between gap-2 font-medium">
                          <span>{row.action.replaceAll("_", " ")}</span>
                          <span>{money(row.amountP)}</span>
                        </p>
                        <p className="text-xs text-muted">
                          {row.requester} · approved by {row.approver} · {row.reason} · {timeLabel(row.at)} · {row.ref}
                        </p>
                      </li>
                    ))}
                    {data.approvals.length === 0 && <li className="py-2 text-muted">No approvals yet.</li>}
                  </ul>
                </Card>
                <Card className="bg-card lg:col-span-2">
                  <h2 className="text-lg font-semibold">Cash shifts</h2>
                  <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
                    {data.shifts.map((shift) => (
                      <li key={shift.id} className="flex flex-wrap justify-between gap-2 py-2">
                        <span className="font-medium">
                          {shift.staffName} · opened {timeLabel(shift.openedAt)}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {shift.closedAt ? (
                            <>
                              <span>Counted {money(shift.countedP ?? 0)}</span>
                              <Chip className={shift.varianceP === 0 ? "bg-olive" : "bg-pink"}>Difference {money(shift.varianceP ?? 0)}</Chip>
                            </>
                          ) : (
                            <>
                              <span>Expected now {money(shift.liveExpectedP ?? 0)}</span>
                              <Chip className="bg-lime">Open</Chip>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </>
          )}
          {tab === "stock" && (
            <>
              <PageTitle muted="Stock" strong="room" />
              <StockPanel data={data} app={host.app} onDone={refresh} />
            </>
          )}
          {tab === "reports" && (
            <>
              <PageTitle muted="Day" strong="report" />
              <ReportPanel report={data.report} closes={data.closes} app={host.app} />
            </>
          )}
          {tab === "close" && (
            <>
              <PageTitle muted="Day" strong="close" />
              <Card className={data.closeProblems.length ? "bg-mustard" : "bg-lime"}>
                <h2 className="text-lg font-semibold">Business date {data.businessDate}</h2>
                {data.closeProblems.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {data.closeProblems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm">Everything is finished. You can close the day.</p>
                )}
                {closing ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={async () => {
                        await act("day_close");
                        setClosing(false);
                      }}
                    >
                      Yes, close the day
                    </Button>
                    <Button variant="ghost" onClick={() => setClosing(false)}>
                      Not yet
                    </Button>
                  </div>
                ) : (
                  <Button className="mt-3" disabled={data.closeProblems.length > 0} onClick={() => setClosing(true)}>
                    Close the day and save the Z report
                  </Button>
                )}
              </Card>
              <h2 className="mt-6 mb-2 text-lg font-semibold">Earlier closes</h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.closes.map((row) => (
                  <li key={row.businessDate} className="flex justify-between gap-2 rounded-2xl bg-card p-3 text-sm">
                    <span>
                      {row.businessDate} <span className="text-xs text-muted">by {row.closedBy}</span>
                    </span>
                    <span className="font-semibold">{money(row.report.totalP)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {tab === "team" && (
            <>
              <PageTitle muted="Team" strong="and roster" />
              <TeamPanel app={host.app} loginPath={host.login} />
            </>
          )}
        </>
      )}
    </AppFrame>
  );
}
