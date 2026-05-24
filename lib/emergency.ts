import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import type { Organization, UserLocation } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;

import { isOsmOpeningHours247 } from "@/lib/emergencyFacilities";

const ROUTINE_NAME_PATTERN =
  /\b(physio|physioth|osteopath|acupun|dental|dentist|laborator|\blab\b|beauty|wellness|spa\b|massage|yoga|pilates|chiropract|cosmetic|aesthetic|acupuncture)\b/i;

/** True when hours/tags indicate 24/7 or urgent emergency availability (Supabase catalog). */
export function isEmergency247Organization(org: Organization): boolean {
  const name = `${org.name} ${org.description ?? ""}`;
  if (ROUTINE_NAME_PATTERN.test(name)) {
    return false;
  }

  const raw = (org.hoursRaw ?? JSON.stringify(org.hours)).toLowerCase();

  if (isOsmOpeningHours247(org.hoursRaw ?? undefined)) {
    return true;
  }

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
    raw.includes("emergency:emergency_ward") ||
    raw.includes("emergency:department")
  ) {
    return true;
  }

  if (
    /\b(emergency\s*(room|department|ward)|a&e|accident\s*&\s*emergency|er\b|urgent\s*care)\b/i.test(
      name,
    )
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

/** Merge Supabase + HDX/GDHO emergency results; Supabase wins near-duplicates. */
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
