"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { formatRupees } from "@/lib/format";
import type { DayClose, DayReport } from "@/lib/pos/types";
import type { AppId } from "@/lib/roles";
import { Card, Chip, DeltaBadge, Segmented, Star, Stat } from "./ui";

const money = (paise: number) => formatRupees(paise / 100);
const hourLabel = (hour: number) => (hour === 0 ? "12a" : hour < 12 ? `${hour}a` : hour === 12 ? "12p" : `${hour - 12}p`);

export function BarChart({ bars, label }: { bars: { label: string; value: number }[]; label: string }) {
  const peak = Math.max(1, ...bars.map((bar) => bar.value));
  const peakIndex = bars.findIndex((bar) => bar.value === peak);
  return (
    <div role="img" aria-label={`${label}. ${bars.map((bar) => `${bar.label} ${money(bar.value)}`).join(", ")}`} className="mt-4 flex h-56 items-stretch gap-1.5 pt-9 sm:gap-3">
      {bars.map((bar, index) => (
        <div key={bar.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div className={`relative w-full max-w-14 rounded-pill transition-[height] duration-200 ${index === peakIndex ? "bg-lime" : "bg-hairline"}`} style={{ height: `${Math.max(bar.value > 0 ? 6 : 2, (bar.value / peak) * 100)}%` }}>
              {index === peakIndex && <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-pill bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white">{money(bar.value)}</span>}
            </div>
          </div>
          <span className="text-xs text-muted">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SalesCard({ report, closes, className = "" }: { report: DayReport; closes: DayClose[]; className?: string }) {
  const [view, setView] = useState<"Hourly" | "Weekly">("Hourly");
  const weekly = [...closes.slice(0, 6).reverse().map((row) => ({ label: new Date(`${row.businessDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }), value: row.report.totalP })), { label: "Today", value: report.totalP }];
  const hourly = report.hourly.map((row) => ({ label: hourLabel(row.hour), value: row.totalP }));
  const bars = view === "Hourly" ? hourly : weekly;
  return (
    <Card className={`bg-card ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sales</h2>
          <p className="text-xs text-muted">{view === "Hourly" ? "Billed today by hour" : "Last 7 business days"}</p>
        </div>
        <Segmented label="Sales period" value={view} onChange={setView} options={[{ value: "Hourly", label: "Hourly" }, { value: "Weekly", label: "Weekly" }]} />
      </div>
      {bars.length === 0 ? <p className="mt-4 rounded-2xl bg-canvas px-4 py-10 text-center text-sm text-muted">No bills yet today.</p> : <BarChart bars={bars} label={`${view} sales`} />}
    </Card>
  );
}

export function SalesHero({ report, closes, className = "" }: { report: DayReport; closes: DayClose[]; className?: string }) {
  const previous = closes[0]?.report.totalP;
  const delta = previous ? Math.round(((report.totalP - previous) / previous) * 100) : null;
  return (
    <Card className={`flex flex-col justify-between gap-8 bg-ink text-white ${className}`}>
      <Star className="absolute -top-3 -right-3 size-28 text-white/10" />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm text-white/70">Billed today</h2>
        {delta !== null && <DeltaBadge>{`${delta >= 0 ? "+" : ""}${delta}% vs last close`}</DeltaBadge>}
      </div>
      <p className="text-5xl font-bold tracking-tight sm:text-6xl">{money(report.totalP)}</p>
      <dl className="flex gap-8 border-t border-dashed border-white/25 pt-4">
        <div>
          <dt className="text-xs text-white/70">Bills</dt>
          <dd className="text-xl font-semibold">{report.billCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/70">Average bill</dt>
          <dd className="text-xl font-semibold">{money(report.averageBillP)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-2 divide-y divide-dashed divide-hairline text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 py-2">
          <dt>{label}</dt>
          <dd className="font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReportPanel({ report, closes, app }: { report: DayReport; closes: DayClose[]; app: AppId }) {
  const { leakage, upi } = report;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
      <SalesHero report={report} closes={closes} className="sm:col-span-2 lg:col-span-4" />
      <SalesCard report={report} closes={closes} className="sm:col-span-2 lg:col-span-8" />

      <Card className="bg-card lg:col-span-4">
        <h2 className="text-lg font-semibold">Tax by head</h2>
        <Rows rows={[["Gross", money(report.grossP)], ["Discounts", money(report.discountP)], ["Taxable value", money(report.taxableP)], ["CGST", money(report.cgstP)], ["SGST", money(report.sgstP)], ["Round off", money(report.roundOffP)], ["Credit notes", money(report.creditNotesP)]]} />
        <a href={`/api/app/${app}/export`} className="tap mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-pill bg-ink px-4 text-sm font-medium text-white">
          <Download size={16} strokeWidth={1.5} aria-hidden />
          Bill register for your CA
        </a>
      </Card>

      <Card className="bg-card lg:col-span-4">
        <h2 className="text-lg font-semibold">Payments and channels</h2>
        <Rows rows={[["Cash", money(report.tenders.cash)], ["UPI", money(report.tenders.upi)], ["Card", money(report.tenders.card)], ["Dine-in", money(report.channels.dine_in)], ["QR", money(report.channels.qr)], ["Takeaway", money(report.channels.takeaway)]]} />
      </Card>

      <Card className="bg-lilac lg:col-span-4">
        <h2 className="text-lg font-semibold">Things to review</h2>
        <dl className="mt-2 text-sm">
          {([["Voided items", leakage.voids], ["Comped items", leakage.comps], ["Bill reprints", leakage.reprints], ["Cancelled bills", leakage.cancelledBills], ["Credit notes", leakage.creditNotes], ["Unverified UPI", leakage.unverifiedUpi], ["Reasons marked Other", leakage.otherReasons]] as const).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-1.5">
              <dt>{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {leakage.discountsByUser.length > 0 && <p className="mt-2 text-xs">Discounts: {leakage.discountsByUser.map((row) => `${row.name} ${money(row.amountP)}`).join(", ")}</p>}
      </Card>

      <Card className="bg-card lg:col-span-4">
        <h2 className="text-lg font-semibold">Top items</h2>
        <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
          {report.topItems.map((row) => (
            <li key={row.name} className="flex justify-between gap-3 py-2">
              <span>
                {row.name} <span className="text-xs text-muted">{Math.round(row.qty * 100) / 100} sold</span>
              </span>
              <span className="font-semibold">{money(row.amountP)}</span>
            </li>
          ))}
          {report.topItems.length === 0 && <li className="py-2 text-muted">Nothing sold yet.</li>}
        </ul>
      </Card>

      <Card className="bg-card lg:col-span-4">
        <h2 className="text-lg font-semibold">UPI reconciliation</h2>
        <Rows rows={[["Confirmed by provider", money(upi.confirmedP)], ["Marked by staff, unverified", money(upi.unverifiedP)], ["Still waiting", String(upi.pending)], ["Unmatched credits", String(upi.unmatched)]]} />
      </Card>

      <Card className="bg-card lg:col-span-4">
        <h2 className="text-lg font-semibold">Shift differences</h2>
        <ul className="mt-2 text-sm">
          {report.variances.map((row) => (
            <li key={`${row.staffName}${row.closedAt}`} className="flex justify-between gap-3 py-1.5">
              <span>{row.staffName}</span>
              <Chip className={row.varianceP === 0 ? "bg-olive" : "bg-pink"}>{money(row.varianceP)}</Chip>
            </li>
          ))}
          {report.variances.length === 0 && <li className="text-muted">No shifts closed yet today.</li>}
        </ul>
        <div className="mt-3">
          <Stat label="Average ticket time" value={report.ticketMinutes} unit="min" className="bg-canvas" />
        </div>
      </Card>
      <Card className="bg-card sm:col-span-2 lg:col-span-12">
        <h2 className="text-lg font-semibold">Past days</h2>
        <ul className="mt-2 divide-y divide-dashed divide-hairline text-sm">
          {closes.map((row) => (
            <li key={row.businessDate} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{new Date(`${row.businessDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</span>
              <span className="text-muted">{row.report.billCount} bills</span>
              <span className="font-semibold">{money(row.report.totalP)}</span>
            </li>
          ))}
          {closes.length === 0 && <li className="py-2 text-muted">No closed days yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
