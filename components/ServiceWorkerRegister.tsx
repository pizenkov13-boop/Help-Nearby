"use client";

import { useEffect } from "react";
import {
  APP_CACHE_VERSION,
  APP_CACHE_VERSION_KEY,
} from "@/lib/appCacheVersion";

async function purgeLegacyCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void purgeLegacyCaches();
      return;
    }

    const storedVersion = localStorage.getItem(APP_CACHE_VERSION_KEY);
    if (storedVersion !== APP_CACHE_VERSION) {
      void purgeLegacyCaches().then(() => {
        localStorage.setItem(APP_CACHE_VERSION_KEY, APP_CACHE_VERSION);
        window.location.reload();
      });
      return;
    }

    const register = navigator.serviceWorker.register("/sw.js");

    register
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              window.location.reload();
            }
          });
        });
      })
      .catch((error) => {
        console.error("[ServiceWorker] registration failed:", error);
      });
  }, []);

  return null;
}
