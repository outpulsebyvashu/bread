import { istHour } from "./money.ts";
import type { Channel, DayReport, PaymentMethod, PosState } from "./types.ts";

export function dayReport(state: PosState, businessDate: string): DayReport {
  const dayBills = state.bills.filter((bill) => bill.businessDate === businessDate);
  const sales = dayBills.filter((bill) => bill.docType !== "credit_note" && bill.status !== "cancelled");
  const credits = dayBills.filter((bill) => bill.docType === "credit_note");
  const sum = (pick: (bill: (typeof sales)[number]) => number) => sales.reduce((total, bill) => total + pick(bill), 0);
  const checks = state.checks.filter((check) => check.businessDate === businessDate && !check.mergedInto);
  const ids = new Set(dayBills.map((bill) => bill.id));

  const tenders: Record<PaymentMethod, number> = { cash: 0, card: 0, upi: 0 };
  const payments = state.payments.filter((payment) => ids.has(payment.billId));
  for (const payment of payments) {
    if (payment.status === "confirmed") tenders[payment.method] += payment.amountP;
  }

  const channels: Record<Channel, number> = { dine_in: 0, takeaway: 0, qr: 0 };
  for (const bill of sales) channels[bill.channel] += bill.totalP;

  const hourly = new Map<number, number>();
  for (const bill of sales) hourly.set(istHour(bill.at), (hourly.get(istHour(bill.at)) ?? 0) + bill.totalP);

  const items = new Map<string, { name: string; qty: number; amountP: number }>();
  for (const bill of sales) {
    for (const line of bill.lines) {
      const row = items.get(line.itemId) ?? { name: line.name, qty: 0, amountP: 0 };
      row.qty += line.qtySold;
      row.amountP += line.comp ? 0 : line.grossP - line.discountP;
      items.set(line.itemId, row);
    }
  }

  const lines = checks.flatMap((check) => check.lines);
  const dayApprovals = state.approvals.filter((row) => checks.some((check) => row.ref.startsWith(String(check.no))) || sales.some((bill) => bill.no === row.ref));
  const discountsByUser = new Map<string, number>();
  for (const bill of sales) {
    if (bill.discountP > 0) discountsByUser.set(bill.issuedBy, (discountsByUser.get(bill.issuedBy) ?? 0) + bill.discountP);
  }

  const kots = state.kots.filter((kot) => kot.readyAt && checks.some((check) => check.id === kot.checkId));
  const ticketMinutes = kots.length
    ? Math.round(kots.reduce((total, kot) => total + ((kot.readyAt ?? kot.at) - kot.at), 0) / kots.length / 60000)
    : 0;

  const totalP = sum((bill) => bill.totalP);
  return {
    businessDate,
    billCount: sales.length,
    orderCount: checks.filter((check) => check.lines.length > 0).length,
    grossP: sum((bill) => bill.subtotalP),
    discountP: sum((bill) => bill.discountP),
    taxableP: sum((bill) => bill.taxableP),
    cgstP: sum((bill) => bill.cgstP),
    sgstP: sum((bill) => bill.sgstP),
    roundOffP: sum((bill) => bill.roundOffP),
    totalP,
    creditNotesP: credits.reduce((total, bill) => total + bill.totalP, 0),
    averageBillP: sales.length ? Math.round(totalP / sales.length) : 0,
    tenders,
    channels,
    hourly: [...hourly.entries()].sort((a, b) => a[0] - b[0]).map(([hour, value]) => ({ hour, totalP: value })),
    topItems: [...items.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
    ticketMinutes,
    leakage: {
      voids: lines.filter((line) => line.status === "void").length,
      comps: lines.filter((line) => line.status === "comp").length,
      reprints: dayBills.reduce((total, bill) => total + bill.reprints, 0),
      cancelledBills: dayBills.filter((bill) => bill.status === "cancelled").length,
      creditNotes: credits.length,
      unverifiedUpi: payments.filter((payment) => payment.method === "upi" && payment.status === "confirmed" && !payment.verified).length,
      otherReasons: dayApprovals.filter((row) => row.reason.startsWith("Other")).length,
      discountsByUser: [...discountsByUser.entries()].map(([name, amountP]) => ({ name, amountP })),
    },
    upi: {
      confirmedP: payments.filter((payment) => payment.method === "upi" && payment.status === "confirmed" && payment.verified).reduce((total, payment) => total + payment.amountP, 0),
      unverifiedP: payments.filter((payment) => payment.method === "upi" && payment.status === "confirmed" && !payment.verified).reduce((total, payment) => total + payment.amountP, 0),
      pending: payments.filter((payment) => payment.status === "pending").length,
      unmatched: payments.filter((payment) => payment.status === "unmatched").length,
    },
    variances: state.shifts
      .filter((shift) => shift.businessDate === businessDate && shift.closedAt)
      .map((shift) => ({ staffName: shift.staffName, varianceP: shift.varianceP ?? 0, closedAt: shift.closedAt ?? 0 })),
  };
}
