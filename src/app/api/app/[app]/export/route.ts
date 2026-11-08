import { unauthenticated } from "@/lib/pos/http";
import { readState } from "@/lib/pos/store";
import { parseApp } from "@/lib/roles";
import { getActor } from "@/lib/session";

const rupees = (paise: number) => (paise / 100).toFixed(2);

// Starts with a quote or apostrophe when a value could run as a spreadsheet formula.
const cell = (value: string | number) => {
  const textValue = String(value);
  const safe = /^[=+\-@\t\r]/.test(textValue) ? `'${textValue}` : textValue;
  return `"${safe.replaceAll('"', '""')}"`;
};

// Bill register for the CA. Managers and the owner only.
export async function GET(_request: Request, { params }: { params: Promise<{ app: string }> }) {
  const app = parseApp((await params).app);
  if (app !== "manager" && app !== "admin") return unauthenticated();
  const actor = await getActor(app);
  if (actor?.role !== "manager" && actor?.role !== "admin") return unauthenticated();

  const header = ["Number", "Type", "Date", "Status", "Channel", "Buyer GSTIN", "Buyer", "Taxable", "CGST", "SGST", "Round off", "Total", "Original"];
  const state = readState();
  const rows = state.bills.map((bill) => [
    bill.no,
    bill.docType,
    bill.businessDate,
    bill.status,
    bill.channel,
    bill.buyerGstin,
    bill.buyerName,
    rupees(bill.taxableP),
    rupees(bill.cgstP),
    rupees(bill.sgstP),
    rupees(bill.roundOffP),
    rupees(bill.totalP),
    state.bills.find((row) => row.id === bill.originalId)?.no ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="breadpos-bills.csv"',
      "Cache-Control": "no-store",
    },
  });
}
