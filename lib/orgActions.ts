import type { Organization } from "@/lib/types";

/** Window events: any list or card can open the organization sheet and the in-site route screen. */
export const ORG_SHEET_OPEN_EVENT = "hn:org-sheet-open";
export const SHEET_CLOSE_EVENT = "hn:org-sheet-close";
export const ROUTE_OPEN_EVENT = "hn:route-open";

let lastTrigger: HTMLElement | null = null;

/** Remember the control that opened a sheet or the route screen, so closing returns the keyboard there. */
function rememberTrigger() {
  if (typeof document === "undefined") return;
  const active = document.activeElement as HTMLElement | null;
  if (active && active !== document.body && !active.closest(".os-layer, .rt-screen")) lastTrigger = active;
}

export function restoreTrigger() {
  const target = lastTrigger;
  lastTrigger = null;
  if (target && document.contains(target)) target.focus();
}

export function openOrganizationSheet(org: Organization) {
  rememberTrigger();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORG_SHEET_OPEN_EVENT, { detail: org }));
  }
}

export function openRoute(org: Organization) {
  rememberTrigger();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ROUTE_OPEN_EVENT, { detail: org }));
  }
}
