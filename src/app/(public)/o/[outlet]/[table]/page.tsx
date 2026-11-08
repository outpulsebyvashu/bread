import { Suspense } from "react";
import { CustomerApp } from "@/components/apps/CustomerApp";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomerApp />
    </Suspense>
  );
}
