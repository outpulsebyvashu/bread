"use client";

import { useState } from "react";
import { CommandError, dateLabel, sendCommand, timeLabel, toPaise, useLive } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { TeamView } from "@/lib/pos/views";
import type { AppId } from "@/lib/roles";
import { ApprovalSheet } from "../ApprovalSheet";
import { Button, Card, Chip, EmptyState, ErrorText, Field, SelectField } from "../ui";

function hoursBetween(from: number, to: number) {
  const minutes = Math.round((to - from) / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Clock, cash bag, roster and sign-in history. Used by Captain, Manager and Admin.
export function TeamPanel({ app, loginPath }: { app: AppId; loginPath: string }) {
  const { data, refresh } = useLive<TeamView>(`/api/app/${app}/view/team`, loginPath, 4000);
  const [error, setError] = useState("");
  const [counted, setCounted] = useState("");
  const [closed, setClosed] = useState<{ expectedP: number; varianceP: number } | null>(null);
  const [askVariance, setAskVariance] = useState(false);
  const [form, setForm] = useState({ staffId: "", date: "", start: "09:00", end: "17:00", section: "Floor" });

  if (!data) return null;
  const run = async (type: string, args: unknown = {}) => {
    setError("");
    try {
      const result = await sendCommand(app, type, args);
      await refresh();
      return result;
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "That did not work");
      return null;
    }
  };
  const closeBag = async (approval?: { reason: string; pin?: string }) => {
    const result = await sendCommand<{ expectedP: number; varianceP: number }>(app, "close_shift", { countedP: toPaise(counted), approval });
    setClosed(result);
    setCounted("");
    await refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="bg-card">
        <h2 className="text-lg font-semibold">My shift clock</h2>
        {data.myClock ? (
          <p className="mt-2 text-sm">
            Clocked in at {timeLabel(data.myClock.inAt)} <Chip className="bg-lime">On shift</Chip>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">You are not clocked in.</p>
        )}
        <div className="mt-3">
          {data.myClock ? <Button variant="soft" onClick={() => run("clock_out")}>Clock out</Button> : <Button onClick={() => run("clock_in")}>Clock in</Button>}
        </div>

        {data.myBag && (
          <div className="mt-4 rounded-2xl bg-canvas p-3">
            <p className="text-sm font-medium">Cash to hand in</p>
            <p className="mb-2 text-xs text-muted">Count your cash before you see the expected amount. Close this before clocking out.</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-32 flex-1">
                <Field label="Cash counted (₹)" inputMode="decimal" value={counted} onChange={(event) => setCounted(event.target.value)} />
              </div>
              <Button
                disabled={counted === ""}
                onClick={async () => {
                  setError("");
                  try {
                    await closeBag();
                  } catch (problem) {
                    if (problem instanceof CommandError && problem.code === "variance_approval") setAskVariance(true);
                    else setError(problem instanceof CommandError ? problem.message : "That did not work");
                  }
                }}
              >
                Close cash
              </Button>
            </div>
          </div>
        )}
        {closed && (
          <p className="mt-3 rounded-2xl bg-lime px-4 py-2 text-sm">
            Expected {formatRupees(closed.expectedP / 100)}. Difference {formatRupees(closed.varianceP / 100)}.
          </p>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Card>

      <Card className="bg-lilac">
        <h2 className="text-lg font-semibold">On shift now</h2>
        {data.clockedIn.length === 0 ? (
          <p className="mt-2 text-sm">Nobody is clocked in.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {data.clockedIn.map((row) => (
              <li key={row.id} className="flex justify-between gap-2 text-sm">
                <span className="font-medium">{row.staffName}</span>
                <span>since {timeLabel(row.inAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="bg-card lg:col-span-2">
        <h2 className="text-lg font-semibold">Roster</h2>
        {data.roster.length === 0 ? (
          <div className="mt-2">
            <EmptyState>No shifts are planned.</EmptyState>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-dashed divide-hairline">
            {data.roster.map((row) => (
              <li key={row.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium">{row.staffName}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <Chip>{row.date}</Chip>
                  <Chip>
                    {row.start} to {row.end}
                  </Chip>
                  {row.section && <Chip className="bg-periwinkle">{row.section}</Chip>}
                  {data.canManage && (
                    <Button variant="ghost" onClick={() => run("roster_delete", { id: row.id })}>
                      Remove
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data.canManage && (
          <form
            className="mt-3 grid grid-cols-1 items-end gap-2 sm:grid-cols-3 lg:grid-cols-6"
            onSubmit={async (event) => {
              event.preventDefault();
              await run("roster_upsert", { ...form, date: form.date || data.businessDate });
            }}
          >
            <SelectField label="Staff" value={form.staffId} onChange={(event) => setForm({ ...form, staffId: event.target.value })}>
              <option value="">Choose</option>
              {data.staff.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </SelectField>
            <Field label="Date" type="date" value={form.date || data.businessDate} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <Field label="Start" type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} />
            <Field label="End" type="time" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} />
            <Field label="Section" value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} />
            <Button type="submit" disabled={!form.staffId}>
              Add shift
            </Button>
          </form>
        )}
      </Card>

      <Card className="bg-card">
        <h2 className="text-lg font-semibold">{data.canManage ? "Clock history" : "My clock history"}</h2>
        <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
          {data.clock.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="font-medium">{row.staffName}</span>
              <span>
                {dateLabel(row.inAt)} · {timeLabel(row.inAt)} to {row.outAt ? `${timeLabel(row.outAt)} (${hoursBetween(row.inAt, row.outAt)})` : "now"}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-card">
        <h2 className="text-lg font-semibold">{data.canManage ? "Sign-ins" : "My sign-ins"}</h2>
        <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
          {data.logins.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium">{row.staffName}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted">
                  {row.app} · {timeLabel(row.at)}
                </span>
                {row.ok ? <Chip className="bg-olive">OK</Chip> : <Chip className="bg-pink">{row.detail}</Chip>}
              </span>
            </li>
          ))}
          {data.logins.length === 0 && <li className="py-2 text-muted">No sign-ins yet.</li>}
        </ul>
      </Card>

      {askVariance && (
        <ApprovalSheet
          title="Cash is off by more than the limit"
          detail="A manager must approve this difference."
          reasons={["Count checked twice", "Change given wrongly", "Other"]}
          role={data.me.role ?? undefined}
          onSubmit={(approval) => closeBag(approval)}
          onClose={() => setAskVariance(false)}
        />
      )}
    </div>
  );
}
