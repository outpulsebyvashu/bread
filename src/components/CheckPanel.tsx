"use client";

import { Banknote, CreditCard, Printer, QrCode, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CommandError, sendCommand, toPaise } from "@/lib/client";
import { formatRupees } from "@/lib/format";
import type { Approvalish, Bill, Payment } from "@/lib/pos/types";
import type { CheckView, FloorView } from "@/lib/pos/views";
import type { AppId, Role } from "@/lib/roles";
import { ApprovalSheet } from "./ApprovalSheet";
import { BillDoc, PrintNow } from "./PrintDocs";
import { Button, Chip, ErrorText, Field, Segmented, Sheet } from "./ui";
import { DEMO_DEPLOYMENT } from "@/lib/demo";

const money = (paise: number) => formatRupees(paise / 100);

const STATUS: Record<string, { label: string; className: string }> = {
  awaiting: { label: "Waiting to accept", className: "bg-pink" },
  held: { label: "On hold", className: "bg-canvas" },
  new: { label: "Sent", className: "bg-pink" },
  preparing: { label: "Preparing", className: "bg-mustard" },
  ready: { label: "Ready", className: "bg-lime" },
  served: { label: "Served", className: "bg-olive" },
  void: { label: "Voided", className: "bg-canvas line-through" },
  comp: { label: "Comp", className: "bg-periwinkle" },
};

function useAction(onError: (message: string) => void) {
  return async (work: () => Promise<unknown>) => {
    onError("");
    try {
      await work();
      return true;
    } catch (problem) {
      onError(problem instanceof CommandError ? problem.message : "That did not work");
      return false;
    }
  };
}

export function LinesList({ check, app, role, reasons, onDone }: { check: CheckView; app: AppId; role: Role | undefined; reasons: FloorView["reasons"]; onDone: () => void }) {
  const [error, setError] = useState("");
  const [asking, setAsking] = useState<{ type: "void_line" | "comp_line"; lineId: string; name: string } | null>(null);
  const act = useAction(setError);
  const lines = check.lines.filter((line) => line.status !== "void");

  return (
    <div>
      <ul className="divide-y divide-dashed divide-hairline">
        {check.lines.map((line) => (
          <li key={line.id} className="py-2">
            <div className="flex items-start justify-between gap-2">
              <p className={`min-w-0 text-sm font-medium ${line.status === "void" ? "text-muted line-through" : ""}`}>
                {line.qty} x {line.name}
                {line.mods.length > 0 && <span className="block text-xs font-normal text-muted">{line.mods.join(", ")}</span>}
                {line.note && <span className="block text-xs font-normal text-muted">Note: {line.note}</span>}
                {line.reason && <span className="block text-xs font-normal text-muted">{line.reason}</span>}
              </p>
              <span className="shrink-0 text-sm">{line.status === "comp" ? "Free" : money(line.unitP * line.qty)}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Chip className={STATUS[line.status]?.className}>{STATUS[line.status]?.label}</Chip>
              {line.status === "held" && (
                <>
                  <Button variant="soft" onClick={() => act(() => sendCommand(app, "fire_held", { checkId: check.id, lineIds: [line.id] })).then(onDone)}>
                    Fire
                  </Button>
                  <Button variant="soft" onClick={() => act(() => sendCommand(app, "remove_unsent", { lineId: line.id })).then(onDone)}>
                    Remove
                  </Button>
                </>
              )}
              {line.status === "ready" && (
                <Button variant="lime" onClick={() => act(() => sendCommand(app, "serve_check", { checkId: check.id, lineId: line.id })).then(onDone)}>
                  Served
                </Button>
              )}
              {!line.billId && ["new", "preparing", "ready", "served"].includes(line.status) && (
                <>
                  <Button variant="ghost" onClick={() => setAsking({ type: "void_line", lineId: line.id, name: line.name })}>
                    Void
                  </Button>
                  {["preparing", "ready", "served"].includes(line.status) && (
                    <Button variant="ghost" onClick={() => setAsking({ type: "comp_line", lineId: line.id, name: line.name })}>
                      Comp
                    </Button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {lines.length === 0 && <p className="py-3 text-sm text-muted">No items yet.</p>}
      <ErrorText>{error}</ErrorText>
      {asking && (
        <ApprovalSheet
          title={`${asking.type === "void_line" ? "Void" : "Comp"} ${asking.name}`}
          detail={asking.type === "void_line" ? "If the kitchen has started, this is recorded as wasted and stock is not returned." : "The guest keeps the item at no charge. Stock stays deducted."}
          reasons={asking.type === "void_line" ? reasons.void : reasons.comp}
          role={role}
          onSubmit={(approval: Approvalish) => sendCommand(app, asking.type, { lineId: asking.lineId, approval }).then(onDone)}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}

function UpiSheet({ app, bill, due, onDone, onClose }: { app: AppId; bill: Bill; due: number; onDone: () => void; onClose: () => void }) {
  const [paymentId, setPaymentId] = useState<string | null>(null);
  // One key per opened sheet, so a repeated request returns the same QR instead of a second one.
  const [requestKey] = useState(() => crypto.randomUUID());
  const [svg, setSvg] = useState("");
  const [state, setState] = useState<"waiting" | "failed" | "paid">("waiting");
  const [error, setError] = useState("");
  const act = useAction(setError);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { paymentId: id } = await sendCommand<{ paymentId: string }>(app, "upi_create", { billId: bill.id, amountP: due, key: requestKey });
        if (cancelled) return;
        setPaymentId(id);
        // Deliberately not a upi:// link: nothing can be paid until a provider is connected.
        setSvg(await QRCode.toString(`breadpos-simulated-upi:${id}:${due}`, { type: "svg", margin: 1 }));
      } catch (problem) {
        setError(problem instanceof CommandError ? problem.message : "Could not create the QR");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app, bill.id, due, requestKey]);

  const closeQr = async () => {
    if (paymentId && state !== "paid") await sendCommand(app, "upi_close", { paymentId }).catch(() => undefined);
    onDone();
    onClose();
  };

  const event = (kind: "success" | "failure") =>
    act(() => sendCommand(app, "upi_provider_event", { paymentId, event: kind })).then((ok) => {
      if (!ok) return;
      setState(kind === "success" ? "paid" : "failed");
      onDone();
    });

  return (
    <Sheet title={`UPI ${money(due)}`} onClose={closeQr}>
      <div className="flex flex-col items-center gap-3 text-center">
        {state === "waiting" && (
          <>
            {svg ? <div className="size-48" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-48 rounded-2xl bg-canvas" />}
            <Chip className="bg-mustard">Waiting for the provider to confirm</Chip>
            <p className="text-sm text-muted">The amount is fixed in this QR. A customer&apos;s phone screen is not proof of payment.</p>
          </>
        )}
        {state === "failed" && <Chip className="bg-pink">Payment failed. Try again or use another tender.</Chip>}
        {state === "paid" && <Chip className="bg-lime">Paid and confirmed</Chip>}
        <ErrorText>{error}</ErrorText>
        {state === "waiting" && paymentId && (
          <div className="w-full rounded-2xl bg-canvas p-3">
            <p className="mb-2 text-xs text-muted">Simulated provider: no real UPI provider is connected yet.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="lime" onClick={() => event("success")}>
                Simulate success
              </Button>
              <Button variant="soft" onClick={() => event("failure")}>
                Simulate failure
              </Button>
            </div>
          </div>
        )}
        <Button variant={state === "paid" ? "primary" : "soft"} onClick={closeQr}>
          {state === "paid" ? "Done" : "Close QR and use another tender"}
        </Button>
      </div>
    </Sheet>
  );
}

function StaticUpiSheet({ app, bill, due, reasons, onDone, onClose }: { app: AppId; bill: Bill; due: number; reasons: string[]; onDone: () => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const act = useAction(setError);
  return (
    <Sheet title="Mark UPI received" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Use this only when the dynamic QR is unavailable. It stays unverified until a manager matches it to a bank record.</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((option) => (
            <button key={option} type="button" aria-pressed={reason === option} onClick={() => setReason(option)} className={`tap min-h-11 rounded-pill px-4 text-sm ${reason === option ? "bg-ink text-white" : "bg-canvas"}`}>
              {option}
            </button>
          ))}
        </div>
        <Field label="UTR or reference (optional)" value={ref} onChange={(event) => setRef(event.target.value)} />
        <ErrorText>{error}</ErrorText>
        <Button
          disabled={!reason}
          onClick={() =>
            act(() => sendCommand(app, "upi_mark_received", { billId: bill.id, amountP: due, reason: reason === "Other" ? "Other: static QR" : reason, ref, key: crypto.randomUUID() })).then((ok) => {
              if (ok) {
                onDone();
                onClose();
              }
            })
          }
        >
          Record {money(due)} as unverified
        </Button>
      </div>
    </Sheet>
  );
}

type BillRow = CheckView["bills"][number];

function TenderBlock({ app, bill, payments, reasons, onChangeDue, onDone }: { app: AppId; bill: BillRow; payments: Payment[]; reasons: FloorView["reasons"]; onChangeDue: (changeP: number) => void; onDone: () => void }) {
  const due = bill.totalP - bill.paidP;
  const [amount, setAmount] = useState(String(due / 100));
  const [tendered, setTendered] = useState("");
  const [cardRef, setCardRef] = useState("");
  const [mode, setMode] = useState<"cash" | "card" | "upi">("upi");
  const [upi, setUpi] = useState<"dynamic" | "static" | null>(null);
  const [error, setError] = useState("");
  const act = useAction(setError);
  const amountP = toPaise(amount);
  const validAmount = Number.isInteger(amountP) && amountP > 0 && amountP <= due;
  const quickCash = validAmount ? [...new Set([amountP, Math.ceil(amountP / 10000) * 10000, Math.ceil(amountP / 50000) * 50000, 200000])].filter((value) => value >= amountP) : [];

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-canvas p-3">
      <p className="flex justify-between text-sm font-medium">
        <span>Due</span>
        <span>{money(due)}</span>
      </p>
      {payments.length > 0 && (
        <ul className="text-xs text-muted">
          {payments.map((payment) => (
            <li key={payment.id}>
              {payment.method.toUpperCase()} {money(payment.amountP)} · {payment.status}
              {!payment.verified && payment.status === "confirmed" && " · unverified"}
            </li>
          ))}
        </ul>
      )}
      <Segmented
        label="Payment method"
        value={mode}
        onChange={setMode}
        options={[
          { value: "upi", label: "UPI" },
          { value: "cash", label: "Cash" },
          { value: "card", label: "Card" },
        ]}
      />
      <Field label="Amount for this payment" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} hint="Lower it to take a part payment." />
      {mode === "cash" && (
        <>
          <Field label="Cash received" inputMode="decimal" value={tendered} onChange={(event) => setTendered(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {quickCash.map((value) => (
              <Button key={value} variant="soft" className="bg-card" aria-label={`Received ${money(value)}`} onClick={() => setTendered(String(value / 100))}>
                {money(value)}
              </Button>
            ))}
          </div>
          <Button
            disabled={!validAmount || toPaise(tendered) < amountP}
            onClick={() =>
              act(async () => {
                const { changeP } = await sendCommand<{ changeP: number }>(app, "pay_cash", { billId: bill.id, amountP, tenderedP: toPaise(tendered), key: crypto.randomUUID() });
                onChangeDue(changeP);
                setTendered("");
                setAmount(String((due - amountP) / 100));
              }).then(onDone)
            }
          >
            <Banknote size={18} strokeWidth={1.5} aria-hidden />
            Take cash
          </Button>
        </>
      )}
      {mode === "card" && (
        <>
          <Field label="Card slip reference (optional)" value={cardRef} onChange={(event) => setCardRef(event.target.value)} />
          <Button
            disabled={!validAmount}
            onClick={() =>
              act(async () => {
                await sendCommand(app, "pay_card", { billId: bill.id, amountP, ref: cardRef, key: crypto.randomUUID() });
                setAmount(String((due - amountP) / 100));
              }).then(onDone)
            }
          >
            <CreditCard size={18} strokeWidth={1.5} aria-hidden />
            Record card payment
          </Button>
        </>
      )}
      {mode === "upi" && (
        <div className="flex flex-wrap gap-2">
          <Button disabled={!validAmount} onClick={() => setUpi("dynamic")}>
            <QrCode size={18} strokeWidth={1.5} aria-hidden />
            Show QR
          </Button>
          <Button variant="soft" disabled={!validAmount} onClick={() => setUpi("static")}>
            <Smartphone size={18} strokeWidth={1.5} aria-hidden />
            Paid on static QR
          </Button>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      {upi === "dynamic" && <UpiSheet app={app} bill={bill} due={amountP} onDone={onDone} onClose={() => setUpi(null)} />}
      {upi === "static" && <StaticUpiSheet app={app} bill={bill} due={amountP} reasons={reasons.upi_override} onDone={onDone} onClose={() => setUpi(null)} />}
    </div>
  );
}

export function BillCard({ app, bill, payments, reasons, role, onDone, canCorrect }: { app: AppId; bill: BillRow; payments: Payment[]; reasons: FloorView["reasons"]; role: Role | undefined; onDone: () => void; canCorrect: boolean }) {
  const [printing, setPrinting] = useState<{ duplicate: boolean } | null>(null);
  // Kept here because the payment block closes as soon as the bill is fully paid.
  const [changeDue, setChangeDue] = useState(0);
  const [asking, setAsking] = useState<"cancel" | "credit" | null>(null);
  const [refund, setRefund] = useState<"cash" | "upi" | "card">("cash");
  const [error, setError] = useState("");
  const act = useAction(setError);
  const paidUp = bill.paid || bill.totalP - bill.paidP === 0;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-dashed border-hairline p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{bill.no}</p>
          {bill.shareLabel && <p className="text-xs text-muted">{bill.shareLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{money(bill.totalP)}</span>
          {bill.status === "cancelled" && <Chip className="bg-canvas">Cancelled</Chip>}
          {bill.status === "credited" && <Chip className="bg-periwinkle">Credit note issued</Chip>}
          {bill.status === "issued" && paidUp && <Chip className="bg-lime">Paid</Chip>}
        </div>
      </div>
      <p className="text-xs text-muted">
        Taxable {money(bill.taxableP)} · CGST {money(bill.cgstP)} · SGST {money(bill.sgstP)}
        {bill.discountP > 0 && ` · Discount ${money(bill.discountP)}`}
        {bill.roundOffP !== 0 && ` · Round off ${money(bill.roundOffP)}`}
      </p>
      {changeDue > 0 && <p role="status" className="rounded-2xl bg-lime px-4 py-3 text-lg font-bold">Give back {money(changeDue)}</p>}
      {bill.status === "issued" && !paidUp && <TenderBlock app={app} bill={bill} payments={payments} reasons={reasons} onChangeDue={setChangeDue} onDone={onDone} />}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="soft"
          onClick={() =>
            act(async () => {
              // The first print is the original. Every later one is logged and stamped.
              const duplicate = sessionStorage.getItem(`printed:${bill.id}`) === "1" || bill.reprints > 0;
              if (duplicate) await sendCommand(app, "reprint_bill", { billId: bill.id });
              sessionStorage.setItem(`printed:${bill.id}`, "1");
              setPrinting({ duplicate });
            }).then(onDone)
          }
        >
          <Printer size={18} strokeWidth={1.5} aria-hidden />
          Print
        </Button>
        {canCorrect && bill.status === "issued" && !paidUp && payments.every((payment) => !["confirmed", "pending"].includes(payment.status)) && (
          <Button variant="ghost" onClick={() => setAsking("cancel")}>
            Cancel bill
          </Button>
        )}
        {canCorrect && bill.status === "issued" && paidUp && (
          <Button variant="ghost" onClick={() => setAsking("credit")}>
            Credit note
          </Button>
        )}
      </div>
      <ErrorText>{error}</ErrorText>
      {printing && (
        <PrintNow onDone={() => setPrinting(null)}>
          <BillDoc bill={bill} duplicate={printing.duplicate} />
        </PrintNow>
      )}
      {asking === "cancel" && (
        <ApprovalSheet
          title={`Cancel ${bill.no}`}
          detail="The number stays on record as cancelled and is never reused. The items go back to the check."
          reasons={reasons.cancel}
          role={role}
          onSubmit={(approval) => sendCommand(app, "cancel_bill", { billId: bill.id, approval }).then(onDone)}
          onClose={() => setAsking(null)}
        />
      )}
      {asking === "credit" && (
        <ApprovalSheet
          title={`Credit note for ${bill.no}`}
          detail={`Refunds ${money(bill.totalP)}. Have your CA confirm the policy for corrections.`}
          extra={
            <Segmented
              label="Refund method"
              value={refund}
              onChange={setRefund}
              options={[
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" },
              ]}
            />
          }
          reasons={reasons.credit}
          role={role}
          onSubmit={(approval) => sendCommand(app, "credit_note", { billId: bill.id, refundMethod: refund, approval }).then(onDone)}
          onClose={() => setAsking(null)}
        />
      )}
    </div>
  );
}

function SplitBuilder({ check, onCancel, onIssue }: { check: CheckView; onCancel: () => void; onIssue: (groups: string[][]) => void }) {
  const lines = check.lines.filter((line) => !line.billId && line.status !== "void" && line.status !== "held");
  const [count, setCount] = useState(2);
  const [assigned, setAssigned] = useState<Record<string, number>>({});
  const groups = Array.from({ length: count }, (_, bill) => lines.filter((line) => (assigned[line.id] ?? 0) === bill).map((line) => line.id));
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-canvas p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Tap the bill each item goes on</p>
        <Button variant="soft" className="bg-card" onClick={() => setCount(Math.min(count + 1, Math.max(lines.length, 2)))}>
          Add bill
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 text-sm">
              {line.qty} x {line.name}
            </span>
            <span className="flex gap-1">
              {Array.from({ length: count }, (_, bill) => (
                <button
                  key={bill}
                  type="button"
                  aria-label={`Put ${line.name} on bill ${bill + 1}`}
                  aria-pressed={(assigned[line.id] ?? 0) === bill}
                  onClick={() => setAssigned({ ...assigned, [line.id]: bill })}
                  className={`tap size-11 rounded-full text-sm font-medium ${(assigned[line.id] ?? 0) === bill ? "bg-ink text-white" : "bg-card"}`}
                >
                  {bill + 1}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button disabled={groups.some((group) => group.length === 0)} onClick={() => onIssue(groups)}>
          Issue {count} bills
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
      {groups.some((group) => group.length === 0) && <p className="text-xs text-muted">Every bill needs at least one item.</p>}
    </div>
  );
}

export function CheckoutPanel({ app, check, reasons, role, rewards, canDiscount, canCorrect, onDone }: { app: AppId; check: CheckView; reasons: FloorView["reasons"]; role: Role | undefined; rewards?: { id: string; name: string; cost: number }[]; canDiscount: boolean; canCorrect: boolean; onDone: () => void }) {
  const [mode, setMode] = useState<"single" | "even" | "items">("single");
  const [parts, setParts] = useState(2);
  const [gstin, setGstin] = useState("");
  const [buyer, setBuyer] = useState("");
  const [showBuyer, setShowBuyer] = useState(false);
  const [discount, setDiscount] = useState("");
  const [askDiscount, setAskDiscount] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [found, setFound] = useState<{ member: { id: string; name: string; points: number; phone: string } | null; rewards: { id: string; name: string; cost: number }[] } | null>(null);
  const [error, setError] = useState("");
  const act = useAction(setError);
  const billable = check.lines.some((line) => !line.billId && line.status !== "void" && line.status !== "held");

  const issue = (extra: { mode: "single" | "even" | "items"; parts?: number; groups?: string[][] }) =>
    act(() => sendCommand(app, "issue_bills", { checkId: check.id, ...extra, buyer: gstin || buyer ? { gstin, name: buyer } : undefined })).then((ok) => {
      if (ok) setMode("single");
      onDone();
    });

  return (
    <div className="flex flex-col gap-3">
      {check.bills.map((bill) => (
        <BillCard key={bill.id} app={app} bill={bill} payments={check.payments.filter((payment) => payment.billId === bill.id)} reasons={reasons} role={role} canCorrect={canCorrect} onDone={onDone} />
      ))}

      {billable && (
        <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-hairline p-3">
          <dl className="text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(check.preview.subtotalP)}</dd>
            </div>
            {check.preview.discountP > 0 && (
              <div className="flex justify-between">
                <dt>Discount ({check.discountReason})</dt>
                <dd>-{money(check.preview.discountP)}</dd>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <dt>CGST + SGST</dt>
              <dd>{money(check.preview.cgstP + check.preview.sgstP)}</dd>
            </div>
            {check.preview.roundOffP !== 0 && (
              <div className="flex justify-between text-muted">
                <dt>Round off</dt>
                <dd>{money(check.preview.roundOffP)}</dd>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-dashed border-hairline pt-1 text-lg font-bold">
              <dt>Total</dt>
              <dd>{money(check.preview.totalP)}</dd>
            </div>
          </dl>

          {canDiscount && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-32 flex-1">
                <Field label="Discount (₹)" inputMode="decimal" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              </div>
              <Button variant="soft" disabled={!discount} onClick={() => setAskDiscount(true)}>
                Apply
              </Button>
              {check.discountP > 0 && (
                <Button variant="ghost" onClick={() => act(() => sendCommand(app, "set_discount", { checkId: check.id, amountP: 0 })).then(onDone)}>
                  Remove
                </Button>
              )}
            </div>
          )}

          {rewards && (
            <div className="flex flex-col gap-2 rounded-2xl bg-canvas p-3">
              <p className="text-sm font-medium">Niro.Cards {check.niroMember && `· ${check.niroMember.name} · ${check.niroMember.points} points`} <span className="font-normal text-muted">(mock adapter)</span></p>
              {!check.niroMember && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-32 flex-1">
                    <Field label="Customer phone" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} hint="Demo member: 9000000001" />
                  </div>
                  <Button variant="soft" className="bg-card" onClick={() => act(async () => setFound(await sendCommand(app, "niro_lookup", { phone })))}>
                    Look up
                  </Button>
                </div>
              )}
              {found && !found.member && <p className="text-sm text-muted">No member found.</p>}
              {found?.member && !check.niroMember && (
                <Button variant="soft" className="bg-card" onClick={() => act(() => sendCommand(app, "niro_attach", { checkId: check.id, memberId: found.member!.id })).then(onDone)}>
                  Attach {found.member.name} ({found.member.phone})
                </Button>
              )}
              {check.niroMember && (
                <>
                  <Field label="Customer's OTP to redeem" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} hint={DEMO_DEPLOYMENT ? "Demo OTP: 123456" : undefined} />
                  <div className="flex flex-wrap gap-2">
                    {rewards.filter((reward) => reward.cost <= (check.niroMember?.points ?? 0)).map((reward) => (
                      <Button key={reward.id} variant="soft" className="bg-card" disabled={!otp} onClick={() => act(() => sendCommand(app, "niro_redeem", { checkId: check.id, rewardId: reward.id, otp })).then(onDone)}>
                        {reward.name} ({reward.cost} pts)
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button type="button" onClick={() => setShowBuyer(!showBuyer)} className="min-h-11 self-start text-sm underline">
            {showBuyer ? "Hide" : "Add"} business buyer GSTIN
          </button>
          {showBuyer && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Buyer GSTIN" value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} />
              <Field label="Buyer name" value={buyer} onChange={(event) => setBuyer(event.target.value)} />
            </div>
          )}

          <Segmented
            label="How to bill"
            value={mode}
            onChange={setMode}
            options={[
              { value: "single", label: "One bill" },
              { value: "even", label: "Split evenly" },
              { value: "items", label: "Split by item" },
            ]}
          />
          {mode === "single" && <Button onClick={() => issue({ mode: "single" })}>Issue bill</Button>}
          {mode === "even" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-28">
                <Field label="People" type="number" min={2} max={20} value={parts} onChange={(event) => setParts(Number(event.target.value))} />
              </div>
              <Button onClick={() => issue({ mode: "even", parts })}>Issue {parts} bills</Button>
            </div>
          )}
          {mode === "items" && <SplitBuilder check={check} onCancel={() => setMode("single")} onIssue={(groups) => issue({ mode: "items", groups })} />}
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      {askDiscount && (
        <ApprovalSheet
          title={`Discount ${formatRupees(Number(discount) || 0)}`}
          detail="Tax is worked out after the discount."
          reasons={reasons.discount}
          role={role}
          pinOptional
          onSubmit={(approval) => sendCommand(app, "set_discount", { checkId: check.id, amountP: toPaise(discount), approval }).then(() => {
            setDiscount("");
            onDone();
          })}
          onClose={() => setAskDiscount(false)}
        />
      )}
    </div>
  );
}
