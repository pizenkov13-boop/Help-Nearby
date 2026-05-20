import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import type { Organization, UserLocation } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;

/** True when hours/tags indicate 24/7 or urgent emergency availability. */
export function isEmergency247Organization(org: Organization): boolean {
  const raw = (org.hoursRaw ?? JSON.stringify(org.hours)).toLowerCase();

  if (
    raw.includes("24/7") ||
    raw.includes("24-7") ||
    raw.includes("24 hours") ||
    raw.includes("24hrs") ||
    raw.includes("24 hrs") ||
    raw.includes("00:00-24:00") ||
    raw.includes("00:00-23:59")
  ) {
    return true;
  }

  if (
    raw.includes("emergency:yes") ||
    raw.includes("emergency:ambulance_station") ||
    raw.includes("emergency:emergency_ward")
  ) {
    return true;
  }

  return false;
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

/** Merge Supabase + Overpass emergency results; Supabase wins near-duplicates. */
export function mergeEmergencyOrganizations(
  primary: Organization[],
  secondary: Organization[],
): Organization[] {
  const merged = [...primary];

  for (const org of secondary) {
    const isDuplicate = primary.some(
      (existing) =>
        existing.id === org.id ||
        distanceMiles(existing.lat, existing.lng, org.lat, org.lng) <
          DUPLICATE_RADIUS_MILES,
    );
    if (!isDuplicate) {
      merged.push(org);
    }
  }

  return merged;
}
