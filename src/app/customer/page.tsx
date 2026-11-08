import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { outletCode } from "@/lib/pos/engine";
import { readState } from "@/lib/pos/store";

export const metadata = { title: "Customer menu · breadPOS" };

// Real customers arrive by scanning the QR on their table. In demo mode this page opens a sample table.
async function DemoTable() {
  await connection();
  const state = readState();
  const table = state.settings.demoMode ? (state.tables.find((row) => row.active && !state.checks.some((check) => check.open && check.tableId === row.id)) ?? state.tables.find((row) => row.active)) : null;
  return table ? (
    <Link href={`/o/${outletCode(state)}/${table.qrToken}`} className="tap flex min-h-32 flex-col justify-between gap-3 rounded-card bg-pink p-6">
      <span className="flex items-start justify-between gap-2 text-2xl font-semibold">Open demo table {table.label}<ArrowUpRight size={20} strokeWidth={1.5} aria-hidden /></span>
      <span className="text-sm">What a guest sees after scanning. Payments here are simulated.</span>
    </Link>
  ) : (
    <p className="rounded-card bg-card p-6 text-sm">Scan the QR code on your table to order. The owner prints these codes from POS Admin, under Tables and QR.</p>
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 sm:p-8">
      <header>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-muted underline">All apps</Link>
        <h1 className="mt-1 text-4xl font-light tracking-tight sm:text-5xl"><span className="text-muted">Customer</span> app</h1>
        <p className="mt-2 text-sm text-muted">Guests scan the QR code on their table. They can see the menu, place an order, and pay, with no sign-in and nothing to install.</p>
      </header>
      <Suspense fallback={<div className="min-h-32 rounded-card bg-canvas" />}>
        <DemoTable />
      </Suspense>
    </main>
  );
}
