import { organizationNeedsGeocoding } from "@/lib/nominatimGeocode";
import { resolveOrganizationCoordinates } from "@/lib/resolveOrganizationCoordinates";
import type { Organization } from "@/lib/types";

const GEOCODE_DELAY_MS = 1100;
const DEFAULT_MAX_GEOCODE = 20;

export async function geocodeVerifiedCatalog(
  orgs: Organization[],
  options?: { maxGeocode?: number; liteMode?: boolean },
): Promise<Organization[]> {
  if (options?.liteMode) return orgs;

  const maxGeocode = options?.maxGeocode ?? DEFAULT_MAX_GEOCODE;
  const result: Organization[] = [];
  let geocoded = 0;

  for (const org of orgs) {
    if (org.verified && organizationNeedsGeocoding(org) && geocoded < maxGeocode) {
      result.push(await resolveOrganizationCoordinates(org));
      geocoded += 1;
      if (geocoded < maxGeocode) {
        await new Promise((resolve) => setTimeout(resolve, GEOCODE_DELAY_MS));
      }
      continue;
    }
    result.push(org);
  }

  return result;
}
