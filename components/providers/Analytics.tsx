"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Runs PostHog after mount only — no SSR, no extra webpack chunk in layout. */
export function Analytics() {
  const pathname = usePathname();
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const initialized = useRef(false);

  useEffect(() => {
    if (!key) return;
    const apiKey = key;

    void import("posthog-js").then(({ default: posthog }) => {
      if (!initialized.current) {
        posthog.init(apiKey, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          ui_host: "https://us.posthog.com",
          capture_pageview: false,
          capture_pageleave: true,
        });
        initialized.current = true;
      }

      if (posthog.__loaded) {
        posthog.capture("$pageview", { $current_url: window.location.href });
      }
    });
  }, [key, pathname]);

  return null;
}
