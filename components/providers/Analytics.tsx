"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  capturePageView,
  ensurePostHog,
  isPostHogEnabled,
} from "@/lib/posthog.client";

/** Runs PostHog after mount only — no SSR, no extra webpack chunk in layout. */
export function Analytics() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isPostHogEnabled()) return;

    void ensurePostHog().then((posthog) => {
      if (!posthog) return;

      if (!initialized.current) {
        initialized.current = true;
        return;
      }

      capturePageView(posthog);
    });
  }, [pathname]);

  return null;
}
