"use client";

import { useSyncExternalStore } from "react";

/** The phone layout (the calm mobile design) applies up to and including this width, as in globals.css. */
export const PHONE_QUERY = "(max-width: 768px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on phones. Server and first render say false (desktop), so markup never mismatches on hydration. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
