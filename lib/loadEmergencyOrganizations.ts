import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import {
  filterEmergency247Organizations,
  sortOrganizationsByDistance,
} from "@/lib/emergency";
import { fetchEmergencyOverpassOrganizations } from "@/lib/overpass.server";
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
 * Load 24/7 emergency organizations from Supabase and Overpass (medical-focused),
 * sorted nearest-first.
 */
export async function loadEmergencyOrganizations(
  location: UserLocation,
  radiusMeters = NEARBY_RADIUS_METERS,
): Promise<Organization[]> {
  const [catalog, overpassResult] = await Promise.all([
    fetchOrganizations(location),
    fetchEmergencyOverpassOrganizations(
      location.lat,
      location.lng,
      radiusMeters,
    ).catch((error) => {
      console.error("[loadEmergencyOrganizations] Overpass failed:", error);
      return [] as Organization[];
    }),
  ]);

  const fromSupabase = filterEmergency247Organizations(catalog);
  const fromOverpass = filterEmergencyVerified(overpassResult);

  const merged = [...fromSupabase];
  for (const org of fromOverpass) {
    if (!merged.some((m) => m.id === org.id)) {
      merged.push(org);
    }
  }

  return sortOrganizationsByDistance(merged, location);
}
