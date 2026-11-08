"use client";

import { Delete } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandError, postJson } from "@/lib/client";
import { isMobileNumber, normalizePhone } from "@/lib/format";
import { APP_INFO, landingApp, parseApp, type Role } from "@/lib/roles";
import { ErrorText, Field } from "./ui";

export type DemoAccount = { name: string; role: Role; phone: string; pin: string };
const FILLS = ["bg-pink", "bg-mustard", "bg-olive", "bg-lilac", "bg-periwinkle", "bg-lime"];
const MIN_PIN = 4;
const MAX_PIN = 6;

// The one sign-in for every app. Where someone lands depends on who they are.
// `demoAccounts` is empty in a live build, and then the sample sign-ins are not shown at all.
export function LoginScreen({ demoAccounts = [] }: { demoAccounts?: DemoAccount[] }) {
  const params = useSearchParams();
  const requested = parseApp(params.get("app") ?? "");
  const next = params.get("next");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const phoneOk = isMobileNumber(normalizePhone(phone));

  // Already signed in here? Go straight on, no PIN needed.
  useEffect(() => {
    let cancelled = false;
    postJson("/api/auth/continue", { app: requested, next })
      .then((result) => {
        if (!cancelled) window.location.assign(result.redirect);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requested, next]);

  const submit = async () => {
    if (!phoneOk || pin.length < MIN_PIN || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await postJson("/api/auth/login", { phone, pin, app: requested, next });
      window.location.assign(result.redirect);
    } catch (problem) {
      setError(problem instanceof CommandError ? problem.message : "Could not sign in");
      setPin("");
      setBusy(false);
    }
  };

  // A physical keyboard works too, once focus has left the phone field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || !phoneOk) return;
      if (/^[0-9]$/.test(event.key)) setPin((current) => `${current}${event.key}`.slice(0, MAX_PIN));
      if (event.key === "Backspace") setPin((current) => current.slice(0, -1));
      if (event.key === "Enter") submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (checking) return <main className="mx-auto w-full max-w-md flex-1 p-6 text-sm text-muted">Checking your sign-in...</main>;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 sm:p-8">
      <header>
        <h1 className="mt-1 text-4xl font-light tracking-tight sm:text-5xl">
          <span className="text-muted">Sign in{requested ? " to" : ""}</span> {requested ? APP_INFO[requested].name : "bread"}
          {!requested && <span className="font-semibold">POS</span>}
        </h1>
        <p className="mt-2 text-sm text-muted">{requested ? APP_INFO[requested].tagline : "One sign-in for every breadPOS app. You will land in the right one for your role."}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-card bg-card p-5 sm:p-6">
        <Field
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(event) => {
            const value = event.target.value;
            setPhone(value);
            setError("");
            if (isMobileNumber(normalizePhone(value))) event.target.blur();
          }}
        />

        <div className={phoneOk ? "" : "opacity-40"}>
          <p className="text-sm font-medium">PIN</p>
          <p aria-live="polite" aria-label={`${pin.length} digits entered`} className="my-3 flex justify-center gap-3">
            {Array.from({ length: Math.max(MIN_PIN, pin.length) }, (_, index) => (
              <span key={index} className={`size-4 rounded-full ${index < pin.length ? "bg-ink" : "bg-hairline"}`} />
            ))}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button key={digit} type="button" disabled={busy || !phoneOk} onClick={() => setPin(`${pin}${digit}`.slice(0, MAX_PIN))} className="tap min-h-14 rounded-2xl bg-canvas text-xl font-medium hover:bg-lime disabled:hover:bg-canvas">
                {digit}
              </button>
            ))}
            <button type="button" disabled={busy || !phoneOk} aria-label="Delete digit" onClick={() => setPin(pin.slice(0, -1))} className="tap flex min-h-14 items-center justify-center rounded-2xl hover:bg-lime disabled:hover:bg-transparent">
              <Delete size={20} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" disabled={busy || !phoneOk} onClick={() => setPin(`${pin}0`.slice(0, MAX_PIN))} className="tap min-h-14 rounded-2xl bg-canvas text-xl font-medium hover:bg-lime disabled:hover:bg-canvas">
              0
            </button>
            <button type="button" disabled={busy || !phoneOk || pin.length < MIN_PIN} onClick={submit} className="tap min-h-14 rounded-2xl bg-ink text-sm font-medium text-white disabled:bg-ink/40">
              {busy ? "..." : "Go"}
            </button>
          </div>
        </div>
        <ErrorText>{error}</ErrorText>
        <p className="text-center text-xs text-muted">Forgot your PIN? Ask the owner to reset it.</p>
      </section>

      {demoAccounts.length > 0 && (
      <section aria-label="Demo accounts">
        <h2 className="mb-2 text-sm font-medium">Demo accounts <span className="font-normal text-muted">Tap one to fill the number</span></h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {demoAccounts.map((row, index) => (
            <li key={row.phone}>
              <button
                type="button"
                onClick={() => {
                  setPhone(row.phone);
                  setPin("");
                  setError("");
                }}
                className={`tap flex min-h-14 w-full flex-col justify-center rounded-2xl px-4 py-2 text-left ${FILLS[index % FILLS.length]}`}
              >
                <span className="text-sm font-semibold">{row.name} <span className="font-normal capitalize">· {row.role} · opens {APP_INFO[landingApp(row.role, requested)].name}</span></span>
                <span className="text-xs">{row.phone} · PIN {row.pin}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      )}
      <Link href="/" className="inline-flex min-h-11 items-center self-start text-sm text-muted underline">All apps</Link>
    </main>
  );
}
