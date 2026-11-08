import type { Metadata } from "next";
import { APP_INFO, type AppId } from "@/lib/roles";

// Each app installs on its own: own name, icon, start screen and scope.
export function appMetadata(app: AppId): Metadata {
  const info = APP_INFO[app];
  return {
    title: `${info.name} · breadPOS`,
    description: info.tagline,
    manifest: `/manifests/${app}`,
    icons: { icon: `/icons/${app}.svg`, apple: `/icons/${app}.svg` },
    appleWebApp: { capable: true, title: info.name, statusBarStyle: "default" },
  };
}

export function appManifest(app: AppId) {
  const info = APP_INFO[app];
  return {
    id: info.home,
    name: `breadPOS ${info.name}`,
    short_name: info.name,
    description: info.tagline,
    start_url: info.home,
    scope: info.home,
    display: "standalone",
    background_color: "#f2f2ed",
    theme_color: info.colour,
    icons: [{ src: `/icons/${app}.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
