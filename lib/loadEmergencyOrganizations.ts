import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import {
  filterEmergency247Organizations,
  mergeEmergencyOrganizations,
  sortOrganizationsByDistance,
} from "@/lib/emergency";
import { fetchEmergencyOverpassOrganizations } from "@/lib/overpass";
import type { Organization, UserLocation } from "@/lib/types";

/**
 * Load 24/7 emergency organizations from Supabase and Overpass (when needed),
 * merged and sorted nearest-first.
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
  const fromOverpass = filterEmergency247Organizations(overpassResult);

  const merged = mergeEmergencyOrganizations(fromSupabase, fromOverpass);
  return sortOrganizationsByDistance(merged, location);
}
