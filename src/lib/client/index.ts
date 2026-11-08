"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppId, Role } from "@/lib/roles";

export class CommandError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function post(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new CommandError(json.error ?? "Something went wrong", json.code ?? "error");
  return json;
}

export async function sendCommand<T = unknown>(app: AppId, type: string, args: unknown = {}) {
  return (await post(`/api/app/${app}/command`, { type, args })).result as T;
}

// `base` is the table's ordering address, /api/orders/{outlet-code}/{table-code}.
export const sendQrCommand = async <T = unknown>(base: string, type: string, args: unknown = {}) =>
  (await post(base, { type, args })).result as T;

export const postJson = post;

export type Me = { name: string; role: Role; staffId: string };

// Keeps a view fresh by polling and refetching on focus. The realtime hook point for
// Supabase: swap the interval for `watch()` from lib/watch at the final stage.
export function useLive<T>(url: string, loginPath?: string, intervalMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [offline, setOffline] = useState(false);
  const [fatal, setFatal] = useState("");
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    const ticket = ++latest.current;
    try {
      const response = await fetch(url, { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (response.status === 401 && loginPath) {
        // The server says where the login lives, which can be another domain.
        window.location.assign(json.login ?? loginPath);
        return;
      }
      if (ticket !== latest.current) return;
      if (!response.ok) {
        setFatal(json.error ?? "Could not load");
        return;
      }
      setData(json.data);
      setMe(json.me ?? null);
      setOffline(false);
      setFatal("");
    } catch {
      if (ticket === latest.current) setOffline(true);
    }
  }, [url, loginPath]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, intervalMs]);

  return { data, me, offline, fatal, refresh };
}

export const toPaise = (rupees: string) => Math.round(Number(rupees) * 100);

export function minutesSince(at: number, now: number) {
  return Math.max(0, Math.floor((now - at) / 60000));
}

const IST: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata" };

export const timeLabel = (at: number) => new Date(at).toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" });
export const dateLabel = (at: number) => new Date(at).toLocaleDateString("en-IN", { ...IST, day: "numeric", month: "short" });
