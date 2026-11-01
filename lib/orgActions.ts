import type { Organization } from "@/lib/types";

/** Window events: any list or card can open the organization sheet and the in-site route screen. */
export const ORG_SHEET_OPEN_EVENT = "hn:org-sheet-open";
export const SHEET_CLOSE_EVENT = "hn:org-sheet-close";
export const ROUTE_OPEN_EVENT = "hn:route-open";

export function openOrganizationSheet(org: Organization) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ORG_SHEET_OPEN_EVENT, { detail: org }));
  }
}

export function openRoute(org: Organization) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ROUTE_OPEN_EVENT, { detail: org }));
  }
}
