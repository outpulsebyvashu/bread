// Bill arithmetic. Integer paise only, so shares always add up exactly.
import type { BillLine, Settings, TaxClass } from "./types.ts";

export type PriceInput = {
  lineId: string;
  itemId: string;
  name: string;
  mods: string[];
  qtyLabel: string;
  qtySold: number;
  grossP: number;
  comp: boolean;
  taxClassId: string;
};

export type Priced = {
  lines: BillLine[];
  subtotalP: number;
  discountP: number;
  taxableP: number;
  cgstP: number;
  sgstP: number;
  roundOffP: number;
  totalP: number;
};

// Splits `total` across `weights` so the parts always sum to exactly `total`.
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  const parts = weights.map((weight) => Math.floor((total * weight) / sum));
  let left = total - parts.reduce((a, b) => a + b, 0);
  const order = weights
    .map((weight, index) => ({ index, remainder: (total * weight) % sum }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; left > 0; i = (i + 1) % order.length) {
    if (weights[order[i].index] > 0) {
      parts[order[i].index] += 1;
      left -= 1;
    }
  }
  return parts;
}

export function priceLines(
  inputs: PriceInput[],
  discountP: number,
  settings: Pick<Settings, "taxMode" | "pricesInclusive" | "roundOff">,
  taxClasses: TaxClass[],
): Priced {
  const chargeable = inputs.map((input) => (input.comp ? 0 : input.grossP));
  const subtotalP = chargeable.reduce((a, b) => a + b, 0);
  const appliedDiscount = Math.min(Math.max(discountP, 0), subtotalP);
  const discounts = allocate(appliedDiscount, chargeable);

  const lines: BillLine[] = inputs.map((input, index) => {
    const net = chargeable[index] - discounts[index];
    const taxClass = taxClasses.find((row) => row.id === input.taxClassId);
    const ratePct = settings.taxMode === "composition" ? 0 : (taxClass?.ratePct ?? 0);
    let taxableP = net;
    let taxP = 0;
    if (ratePct > 0) {
      if (settings.pricesInclusive) {
        taxableP = Math.round((net * 100) / (100 + ratePct));
        taxP = net - taxableP;
      } else {
        taxP = Math.round((net * ratePct) / 100);
      }
    }
    const cgstP = Math.floor(taxP / 2);
    return {
      lineId: input.lineId,
      itemId: input.itemId,
      name: input.name,
      mods: input.mods,
      qtyLabel: input.qtyLabel,
      qtySold: input.qtySold,
      grossP: input.grossP,
      discountP: discounts[index],
      taxableP,
      ratePct,
      cgstP,
      sgstP: taxP - cgstP,
      sacHsn: taxClass?.sacHsn ?? "",
      comp: input.comp,
    };
  });

  const taxableP = lines.reduce((sum, line) => sum + line.taxableP, 0);
  const cgstP = lines.reduce((sum, line) => sum + line.cgstP, 0);
  const sgstP = lines.reduce((sum, line) => sum + line.sgstP, 0);
  const exact = taxableP + cgstP + sgstP;
  const totalP = settings.roundOff ? Math.round(exact / 100) * 100 : exact;

  return {
    lines,
    subtotalP,
    discountP: appliedDiscount,
    taxableP,
    cgstP,
    sgstP,
    roundOffP: totalP - exact,
    totalP,
  };
}

// Indian financial year label, e.g. 5 Nov 2026 gives "2627".
export function financialYear(businessDate: string) {
  const [year, month] = businessDate.split("-").map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(2)}${String(start + 1).slice(2)}`;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function istDate(at: number) {
  return new Date(at + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function istHour(at: number) {
  return new Date(at + IST_OFFSET_MS).getUTCHours();
}
