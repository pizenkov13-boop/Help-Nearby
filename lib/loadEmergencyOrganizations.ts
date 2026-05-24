import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import {
  emergencyFacilityPriority,
  isGenuineEmergencyOrganization,
} from "@/lib/emergencyFacilities";
import {
  filterEmergency247Organizations,
  sortOrganizationsByDistance,
} from "@/lib/emergency";
import { fetchEmergencyOverpassOrganizations } from "@/lib/overpass.server";
import type { Organization, UserLocation } from "@/lib/types";

function filterGenuineEmergencyOrganizations(
  orgs: Organization[],
): Organization[] {
  return orgs.filter(isGenuineEmergencyOrganization);
}

function sortEmergencyByPriorityAndDistance(
  orgs: Organization[],
  location: UserLocation,
): Organization[] {
  const withDistance = sortOrganizationsByDistance(orgs, location);
  return [...withDistance].sort((a, b) => {
    const priorityDiff =
      emergencyFacilityPriority(a) - emergencyFacilityPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    const distA = parseFloat(a.distance) || 999;
    const distB = parseFloat(b.distance) || 999;
    return distA - distB;
  });
}

/**
 * Load 24/7 emergency organizations from Supabase and Overpass,
 * sorted by facility type priority then distance.
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
  const fromOverpass = filterGenuineEmergencyOrganizations(overpassResult);

  const merged = [...fromSupabase];
  for (const org of fromOverpass) {
    if (!merged.some((m) => m.id === org.id)) {
      merged.push(org);
    }
  }

  return sortEmergencyByPriorityAndDistance(merged, location);
}
