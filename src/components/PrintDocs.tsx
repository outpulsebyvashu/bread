"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatRupees } from "@/lib/format";
import type { Bill } from "@/lib/pos/types";
import type { KdsView } from "@/lib/pos/views";
import { dateLabel, timeLabel } from "@/lib/client";

const money = (paise: number) => formatRupees(paise / 100);
const TITLES = { tax_invoice: "Tax invoice", bill_of_supply: "Bill of supply", credit_note: "Credit note" };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className={`flex justify-between ${strong ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}

export function BillDoc({ bill, duplicate }: { bill: Bill; duplicate: boolean }) {
  return (
    <div className="p-2 font-mono text-[11px] leading-snug text-black">
      <p className="text-center text-sm font-bold">{bill.seller.shopName}</p>
      <p className="text-center">{bill.seller.legalName}</p>
      <p className="text-center">{bill.seller.address}</p>
      {bill.seller.gstin && <p className="text-center">GSTIN: {bill.seller.gstin}</p>}
      <p className="text-center">FSSAI: {bill.seller.fssai}</p>
      <p className="mt-1 text-center font-bold">{TITLES[bill.docType]}</p>
      {duplicate && <p className="text-center font-bold">DUPLICATE</p>}
      {bill.status === "cancelled" && <p className="text-center font-bold">CANCELLED</p>}
      <p className="mt-1">No: {bill.no}</p>
      <p>
        {dateLabel(bill.at)} {timeLabel(bill.at)} · {bill.tableLabel}
      </p>
      {bill.shareLabel && <p>{bill.shareLabel}</p>}
      {bill.buyerGstin && <p>Buyer GSTIN: {bill.buyerGstin}</p>}
      {bill.buyerName && <p>Buyer: {bill.buyerName}</p>}
      <div className="my-1 border-t border-dashed border-black" />
      {bill.lines.map((line) => (
        <div key={line.lineId}>
          <Row label={`${line.qtyLabel} x ${line.name}`} value={line.comp ? "Comp" : money(line.grossP)} />
          {line.mods.length > 0 && <p>  {line.mods.join(", ")}</p>}
        </div>
      ))}
      <div className="my-1 border-t border-dashed border-black" />
      <Row label="Subtotal" value={money(bill.subtotalP)} />
      {bill.discountP > 0 && <Row label={`Discount (${bill.discountReason})`} value={`-${money(bill.discountP)}`} />}
      {bill.docType !== "bill_of_supply" && (
        <>
          <Row label={`Taxable value${bill.lines[0]?.sacHsn ? ` (SAC ${bill.lines[0].sacHsn})` : ""}`} value={money(bill.taxableP)} />
          <Row label="CGST" value={money(bill.cgstP)} />
          <Row label="SGST" value={money(bill.sgstP)} />
        </>
      )}
      {bill.roundOffP !== 0 && <Row label="Round off" value={money(bill.roundOffP)} />}
      <Row label="Total" value={money(bill.totalP)} strong />
      {bill.docType === "bill_of_supply" && <p className="mt-1">Composition taxable person, not eligible to collect tax on supplies.</p>}
      {bill.docType === "credit_note" && <p className="mt-1">Against the original bill. Reason: {bill.statusReason}</p>}
    </div>
  );
}

export function KotDoc({ kot, duplicate }: { kot: KdsView["tickets"][number]; duplicate: boolean }) {
  return (
    <div className="p-2 font-mono text-xs leading-snug text-black">
      <p className="text-center text-sm font-bold">KOT {kot.no}</p>
      {duplicate && <p className="text-center font-bold">DUPLICATE</p>}
      <p>
        {kot.tableLabel} · Order {kot.checkNo} · Round {kot.round}
      </p>
      <p>
        {kot.stationId} · {timeLabel(kot.at)}
      </p>
      <div className="my-1 border-t border-dashed border-black" />
      {kot.lines.map((line) => (
        <div key={line.id} className={line.status === "void" ? "line-through" : ""}>
          <p className="font-bold">
            {line.qty} x {line.name}
          </p>
          {line.mods.length > 0 && <p>  {line.mods.join(", ")}</p>}
          {line.note && <p>  Note: {line.note}</p>}
        </div>
      ))}
      {kot.alert && <p className="mt-1 font-bold">{kot.alert}</p>}
    </div>
  );
}

// Renders a document into the 80 mm print area, prints it, then closes.
export function PrintNow({ children, onDone }: { children: React.ReactNode; onDone: () => void }) {
  useEffect(() => {
    const finished = () => onDone();
    window.addEventListener("afterprint", finished);
    const timer = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", finished);
    };
    // Prints once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(<div className="print-area hidden print:block">{children}</div>, document.body);
}
