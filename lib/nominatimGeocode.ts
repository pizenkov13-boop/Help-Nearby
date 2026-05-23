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
