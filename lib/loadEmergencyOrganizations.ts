import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import {
  filterEmergency247Organizations,
  sortOrganizationsByDistance,
} from "@/lib/emergency";
import { fetchVerifiedNearbyOrganizations } from "@/lib/verifiedNearby.server";
import type { Organization, UserLocation } from "@/lib/types";

function filterEmergencyVerified(orgs: Organization[]): Organization[] {
  return orgs.filter(
    (org) =>
      org.category === "medical" ||
      org.categories.includes("medical") ||
      /hospital|clinic|ambulance|emergency|health/i.test(
        `${org.name} ${org.description}`,
      ),
  );
}

/**
 * Load 24/7 emergency organizations from Supabase and HDX/GDHO (medical-focused),
 * sorted nearest-first.
 */
export async function loadEmergencyOrganizations(
  location: UserLocation,
  radiusMeters = NEARBY_RADIUS_METERS,
  country?: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const [catalog, verifiedResult] = await Promise.all([
    fetchOrganizations(location),
    country
      ? fetchVerifiedNearbyOrganizations(
          location,
          radiusMeters,
          country,
          countryCode,
        ).catch((error) => {
          console.error("[loadEmergencyOrganizations] HDX/GDHO failed:", error);
          return [] as Organization[];
        })
      : Promise.resolve([] as Organization[]),
  ]);

  const fromSupabase = filterEmergency247Organizations(catalog);
  const fromVerified = filterEmergencyVerified(verifiedResult);

  const merged = [...fromSupabase];
  for (const org of fromVerified) {
    if (!merged.some((m) => m.id === org.id)) {
      merged.push(org);
    }
  }

  return sortOrganizationsByDistance(merged, location);
}
