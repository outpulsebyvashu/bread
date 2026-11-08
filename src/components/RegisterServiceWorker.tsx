"use client";

import { useEffect } from "react";

// Production only, so the service worker can't serve stale pages during development.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
