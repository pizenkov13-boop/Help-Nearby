import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { organizationHasTrustedCoordinates } from "@/lib/organizationCoordinates";
import type { Organization } from "@/lib/types";

/** Full Nominatim search string for placing a marker on the building. */
export function buildNominatimQuery(org: Organization): string {
  return [org.name, org.address, org.city, org.country]
    .filter(Boolean)
    .join(", ")
    .trim();
}

export function organizationHasGeocodableAddress(org: Organization): boolean {
  return buildNominatimQuery(org).length > 0;
}

/** True when Nominatim is needed because stored coordinates are missing. */
export function organizationNeedsGeocoding(org: Organization): boolean {
  if (organizationHasTrustedCoordinates(org)) return false;
  if (hasValidMapCoordinates(org)) return false;
  return organizationHasGeocodableAddress(org);
}
