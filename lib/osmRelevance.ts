import { isOverpassOrganization } from "@/lib/organizationCoordinates";
import type { Organization } from "@/lib/types";

/** Most unverified OSM entries shown on screen at once (list and map). */
export const MAX_OSM_ON_SCREEN = 30;

/**
 * Pharmacies and shops are commercial POIs: hidden in the default "All categories" view.
 * Older cached results have no `osmKind`, so fall back to the description text.
 */
export function isCommercialOsmOrganization(org: Organization): boolean {
  if (!isOverpassOrganization(org)) return false;
  if (org.osmKind) {
    return org.osmKind === "pharmacy" || org.osmKind.startsWith("shop");
  }
  return /\b(pharmacy|shop)\b/i.test(org.description ?? "");
}

/** Keeps every non-OSM entry and at most `max` OSM entries (in their current, nearest-first order). */
export function limitOsmOrganizations(
  orgs: Organization[],
  max = MAX_OSM_ON_SCREEN,
): Organization[] {
  let osmSeen = 0;
  return orgs.filter((org) => {
    if (!isOverpassOrganization(org)) return true;
    osmSeen += 1;
    return osmSeen <= max;
  });
}
