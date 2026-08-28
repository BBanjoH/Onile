"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability still works without the service worker; offline
        // caching is a nice-to-have, not a hard requirement.
      });
    }
  }, []);

  return null;
}
