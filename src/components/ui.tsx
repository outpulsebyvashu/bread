"use client";

import { X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

export function Card({ className = "bg-card", children }: { className?: string; children: ReactNode }) {
  return <section className={`relative overflow-hidden rounded-card p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function PageTitle({ muted, strong, children }: { muted: string; strong: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
        <span className="text-muted">{muted}</span> {strong}
      </h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function DeltaBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-pill bg-lime px-2.5 py-1 text-xs font-semibold text-ink">{children}</span>;
}

export function Chip({ className = "bg-canvas", children }: { className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium whitespace-nowrap ${className}`}>{children}</span>;
}

export function Dashes({ count, total }: { count: number; total: number }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`h-1.5 flex-1 rounded-pill ${index < count ? "bg-ink" : "bg-ink/15"}`} />
      ))}
    </span>
  );
}

export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 0c1 7 4 10.5 12 12-8 1.5-11 5-12 12-1-7-4-10.5-12-12C8 10.5 11 7 12 0Z" />
    </svg>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "lime" | "danger" | "ghost" };

const VARIANTS = {
  primary: "bg-ink text-white disabled:bg-ink/40",
  soft: "bg-canvas text-ink hover:bg-lime disabled:opacity-50",
  lime: "bg-lime text-ink disabled:opacity-50",
  danger: "border border-red-800 text-red-800 disabled:opacity-50",
  ghost: "text-ink hover:bg-lime disabled:opacity-50",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`tap inline-flex min-h-11 items-center justify-center gap-1.5 rounded-pill px-4 text-sm font-medium ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function IconButton({ icon: Icon, label, className = "bg-card hover:bg-lime", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} {...props} className={`tap flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${className}`}>
      <Icon size={18} strokeWidth={1.5} aria-hidden />
    </button>
  );
}

// One on/off switch. The tap area is 64 x 44 px even though the drawn switch is smaller.
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className="tap flex min-h-11 min-w-16 shrink-0 items-center justify-center rounded-full disabled:opacity-50">
      <span className={`relative h-8 w-14 rounded-pill transition-colors ${checked ? "bg-lime" : "bg-hairline"}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-ink transition-[left] ${checked ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label?: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-pill bg-canvas p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`tap min-h-11 rounded-pill px-4 text-sm font-medium ${value === option.value ? "bg-ink text-white" : "text-ink"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
      {label}
      <input {...props} className="min-h-11 w-full rounded-2xl bg-canvas px-4 text-base font-normal outline-none focus:ring-2 focus:ring-ink" />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function SelectField({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
      {label}
      <select {...props} className="min-h-11 w-full rounded-2xl bg-canvas px-4 text-base font-normal outline-none focus:ring-2 focus:ring-ink">
        {children}
      </select>
    </label>
  );
}

export function Sheet({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
    // Focus moves once when the sheet opens, even if the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6 print:hidden" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-card bg-card p-5 outline-none sm:rounded-card sm:p-6 ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <IconButton icon={X} label="Close" onClick={onClose} className="bg-canvas hover:bg-lime" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-2xl bg-pink px-4 py-2 text-sm">
      {children}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Stat({ label, value, unit, className = "bg-card", badge }: { label: string; value: ReactNode; unit?: string; className?: string; badge?: ReactNode }) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm">{label}</h3>
        {badge}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {value}
        {unit && <span className="ml-1 text-base font-medium">{unit}</span>}
      </p>
    </Card>
  );
}

export function Loading() {
  return <p className="p-6 text-sm text-muted">Loading...</p>;
}
