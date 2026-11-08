"use client";

import { LogOut, Menu, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { postJson, type Me } from "@/lib/client";
import { useEmbedded } from "@/lib/client/host";
import { APP_INFO, type AppId } from "@/lib/roles";
import { Segmented, Sheet } from "./ui";

export type Tab<T extends string> = { id: T; label: string; short?: string; icon: LucideIcon };
export type RailLink = { href: string; label: string; icon: LucideIcon };

// The phone bar has room for five items. Anything beyond four moves into More.
const PHONE_SLOTS = 4;
const ITEM = "tap flex min-h-12 min-w-12 flex-1 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 sm:size-12 sm:flex-none sm:rounded-full sm:p-0";

function NavLabel({ children }: { children: ReactNode }) {
  return <span className="max-w-full truncate text-[11px] leading-none sm:hidden">{children}</span>;
}

// One frame for all three apps: labelled bottom bar on phones, slim left rail from tablet up.
export function AppFrame<T extends string>({
  app,
  tabs,
  active,
  onTab,
  links = [],
  me,
  offline,
  children,
}: {
  app: AppId;
  tabs: Tab<T>[];
  active?: T;
  onTab?: (tab: T) => void;
  links?: RailLink[];
  me: Me | null;
  offline: boolean;
  children: ReactNode;
}) {
  const [more, setMore] = useState(false);
  const embedded = useEmbedded();
  const signOut = async () => {
    const result = await postJson(`/api/app/${app}/logout`, {}).catch(() => undefined);
    window.location.assign(result?.login ?? APP_INFO[app].login);
  };

  const total = tabs.length + links.length;
  const overflow = total + 1 > PHONE_SLOTS + 1;
  const hiddenOnPhone = (index: number) => (overflow && index >= PHONE_SLOTS ? "hidden sm:flex" : "");
  const moreActive = tabs.findIndex((tab) => tab.id === active) >= PHONE_SLOTS;
  const sheetItem = "tap flex min-h-14 items-center gap-3 rounded-2xl bg-canvas px-4 text-left text-sm font-medium hover:bg-lime";

  // Inside the Admin app: no second navigation bar, just this screen's own sections.
  if (embedded) {
    return (
      <div className="flex flex-col gap-4">
        {offline && (
          <p role="status" className="flex items-center gap-2 rounded-2xl bg-mustard px-4 py-3 text-sm font-medium">
            <WifiOff size={18} strokeWidth={1.5} aria-hidden />
            Connection lost. Screens are out of date.
          </p>
        )}
        {tabs.length > 1 && active && <Segmented label={`${APP_INFO[app].name} sections`} value={active} onChange={(id) => onTab?.(id)} options={tabs.map((tab) => ({ value: tab.id, label: tab.short ?? tab.label }))} />}
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <nav
        aria-label={`${APP_INFO[app].name} navigation`}
        className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-0.5 bg-card px-1 py-1.5 sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-20 sm:flex-col sm:justify-start sm:gap-2 sm:overflow-y-auto sm:bg-transparent sm:py-6 print:hidden"
      >
        {tabs.map(({ id, label, short, icon: Icon }, index) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            aria-current={active === id ? "page" : undefined}
            onClick={() => onTab?.(id)}
            className={`${ITEM} ${hiddenOnPhone(index)} ${active === id ? "bg-ink text-white" : "text-ink hover:bg-lime"}`}
          >
            <Icon size={20} strokeWidth={1.5} aria-hidden />
            <NavLabel>{short ?? label}</NavLabel>
          </button>
        ))}
        {links.map(({ href, label, icon: Icon }, index) => (
          <Link key={href} href={href} aria-label={label} title={label} className={`${ITEM} ${hiddenOnPhone(tabs.length + index)} text-ink hover:bg-lime`}>
            <Icon size={20} strokeWidth={1.5} aria-hidden />
            <NavLabel>{label}</NavLabel>
          </Link>
        ))}
        {overflow && (
          <button type="button" aria-label="More" aria-haspopup="dialog" onClick={() => setMore(true)} className={`${ITEM} sm:hidden ${moreActive ? "bg-ink text-white" : "text-ink hover:bg-lime"}`}>
            <Menu size={20} strokeWidth={1.5} aria-hidden />
            <NavLabel>More</NavLabel>
          </button>
        )}
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className={`${ITEM} ${overflow ? "hidden sm:flex" : ""} text-ink hover:bg-lime sm:mt-auto`}>
          <LogOut size={20} strokeWidth={1.5} aria-hidden />
          <NavLabel>Sign out</NavLabel>
        </button>
      </nav>
      {more && (
        <Sheet title="More" onClose={() => setMore(false)}>
          <div className="grid grid-cols-1 gap-2">
            {tabs.slice(PHONE_SLOTS).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onTab?.(id);
                  setMore(false);
                }}
                className={`${sheetItem} ${active === id ? "bg-ink text-white hover:bg-ink" : ""}`}
              >
                <Icon size={20} strokeWidth={1.5} aria-hidden />
                {label}
              </button>
            ))}
            {links.slice(Math.max(0, PHONE_SLOTS - tabs.length)).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={sheetItem}>
                <Icon size={20} strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            ))}
            <button type="button" onClick={signOut} className={sheetItem}>
              <LogOut size={20} strokeWidth={1.5} aria-hidden />
              Sign out
            </button>
          </div>
        </Sheet>
      )}
      <main className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 p-4 pb-24 sm:py-6 sm:pr-6 sm:pl-24 lg:pr-8 print:p-0">
        {offline && (
          <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl bg-mustard px-4 py-3 text-sm font-medium print:hidden">
            <WifiOff size={18} strokeWidth={1.5} aria-hidden />
            Connection lost. Screens are out of date and new actions may fail. Use the paper bill routine if this continues.
          </p>
        )}
        <div className="print:hidden">
          {me && (
            <p className="mb-2 text-xs text-muted">
              {APP_INFO[app].name} · {me.name} · {me.role}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
