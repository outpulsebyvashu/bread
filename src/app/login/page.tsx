import { Suspense } from "react";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata = { title: "Sign in · breadPOS" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
