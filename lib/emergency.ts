import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import type { Organization, UserLocation } from "@/lib/types";

/** True when hours text explicitly indicates 24/7 availability. */
export function isEmergency247Organization(org: Organization): boolean {
  const raw = (org.hoursRaw ?? JSON.stringify(org.hours)).toLowerCase();
  return (
    raw.includes("24/7") ||
    raw.includes("24-7") ||
    raw.includes("24 hours") ||
    raw.includes("24hrs") ||
    raw.includes("24 hrs")
  );
}

export function filterEmergency247Organizations(
  orgs: Organization[],
): Organization[] {
  return orgs.filter(isEmergency247Organization);
}

export function sortOrganizationsByDistance(
  orgs: Organization[],
  location: UserLocation,
): Organization[] {
  return [...orgs]
    .map((org) => ({
      org,
      miles: distanceMiles(location.lat, location.lng, org.lat, org.lng),
    }))
    .sort((a, b) => a.miles - b.miles)
    .map(({ org }) => ({
      ...org,
      distance: formatDistanceMiles(
        location.lat,
        location.lng,
        org.lat,
        org.lng,
      ),
    }));
}

export function getEmergency247Organizations(
  orgs: Organization[],
  location: UserLocation,
): Organization[] {
  return sortOrganizationsByDistance(
    filterEmergency247Organizations(orgs),
    location,
  );
}
