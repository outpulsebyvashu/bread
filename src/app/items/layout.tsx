import { appMetadata } from "@/lib/install";

// Gives this app its own name, icon and install, separate from the other apps.
export const metadata = appMetadata("items");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
