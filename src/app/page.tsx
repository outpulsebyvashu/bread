import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { APP_INFO, APPS } from "@/lib/roles";

const FILLS = { pos: "bg-olive", captain: "bg-pink", kitchen: "bg-mustard", items: "bg-lime", manager: "bg-periwinkle", admin: "bg-lilac" };

// Starting point for this local build. Six staff apps and the customer app, each separate.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 sm:max-w-4xl sm:p-8">
      <header>
        <h1 className="text-4xl font-light tracking-tight sm:text-6xl">
          <span className="text-muted">bread</span>POS
        </h1>
        <p className="mt-2 text-sm text-muted">Six staff apps and a customer app. Open one on its device, sign in, and add it to the home screen. Local demo with sample data.</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <li key={app}>
            <Link href={APP_INFO[app].login} className={`tap flex min-h-44 flex-col justify-between gap-4 rounded-card p-6 ${FILLS[app]}`}>
              <span className="flex items-start justify-between gap-2 text-2xl font-semibold">
                {APP_INFO[app].name}
                <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-sm">{APP_INFO[app].tagline}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/customer" className="tap flex min-h-44 flex-col justify-between gap-4 rounded-card border border-dashed border-hairline bg-card p-6">
            <span className="flex items-start justify-between gap-2 text-2xl font-semibold">
              Customer
              <ArrowUpRight size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-sm">Guests scan a table QR to see the menu, order and pay. No sign-in.</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
