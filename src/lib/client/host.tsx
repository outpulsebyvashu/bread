"use client";

import { createContext, useContext, type ReactNode } from "react";
import { APP_INFO, type AppId } from "@/lib/roles";

// Which app's session a screen talks to. Screens run in their own app by default;
// the Admin app hosts them inside "Run the shop" using the admin session instead.
type Host = { app: AppId; login: string; embedded: boolean };

const HostContext = createContext<Host | null>(null);

export function HostProvider({ app, children }: { app: AppId; children: ReactNode }) {
  return <HostContext.Provider value={{ app, login: APP_INFO[app].login, embedded: true }}>{children}</HostContext.Provider>;
}

export function useHost(own: AppId): Host {
  return useContext(HostContext) ?? { app: own, login: APP_INFO[own].login, embedded: false };
}

export const useEmbedded = () => useContext(HostContext)?.embedded ?? false;
