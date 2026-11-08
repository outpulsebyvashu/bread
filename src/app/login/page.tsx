import { Suspense } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { DEMO_DEPLOYMENT } from "@/lib/demo";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";

export const metadata = { title: "Sign in · breadPOS" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginScreen demoAccounts={DEMO_DEPLOYMENT ? DEMO_ACCOUNTS : []} />
    </Suspense>
  );
}
