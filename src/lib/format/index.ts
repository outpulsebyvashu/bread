// Display only: money is always computed in Postgres RPCs.
// Whole rupees are shown without a trailing .00.
export function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Indian mobile numbers, with or without +91 or a leading 0.
export function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export const isMobileNumber = (value: string) => /^[6-9][0-9]{9}$/.test(value);
