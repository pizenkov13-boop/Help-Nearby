import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import type { Organization, UserLocation } from "@/lib/types";

/** Max road-snap drift before keeping original coordinates. */
export const MAX_ROAD_SNAP_MILES = 0.3;

/** Allow small floating-point / geocoder drift vs search radius. */
const RADIUS_TOLERANCE = 1.12;

export function isOverpassOrganization(org: Organization): boolean {
  return org.id.startsWith("overpass-");
}

export function isPlausibleCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (Math.abs(lat) < 0.001 || Math.abs(lng) < 0.001) return false;
  return true;
}

function maxAllowedMiles(radiusMeters: number): number {
  return (radiusMeters / 1609.34) * RADIUS_TOLERANCE;
}

function distanceWithinRadius(
  lat: number,
  lng: number,
  userLocation: UserLocation,
  maxRadiusMeters: number,
): boolean {
  return (
    distanceMiles(userLocation.lat, userLocation.lng, lat, lng) <=
    maxAllowedMiles(maxRadiusMeters)
  );
}

/**
 * If coordinates look swapped (lat/lng reversed), return corrected pair when
 * the swap lands within the search radius and the original does not.
 */
export function tryFixSwappedCoordinates(
  lat: number,
  lng: number,
  userLocation: UserLocation,
  maxRadiusMeters: number,
): { lat: number; lng: number } | null {
  if (!isPlausibleCoordinate(lat, lng)) return null;

  const originalWithin = distanceWithinRadius(
    lat,
    lng,
    userLocation,
    maxRadiusMeters,
  );
  if (originalWithin) return { lat, lng };

  // lng value must be a valid latitude when swapped
  if (Math.abs(lng) > 90) return null;

  const swapLat = lng;
  const swapLng = lat;
  if (!isPlausibleCoordinate(swapLat, swapLng)) return null;

  const swappedWithin = distanceWithinRadius(
    swapLat,
    swapLng,
    userLocation,
    maxRadiusMeters,
  );
  if (!swappedWithin) return null;

  const originalMiles = distanceMiles(
    userLocation.lat,
    userLocation.lng,
    lat,
    lng,
  );
  const swappedMiles = distanceMiles(
    userLocation.lat,
    userLocation.lng,
    swapLat,
    swapLng,
  );

  if (swappedMiles + 0.05 < originalMiles) {
    return { lat: swapLat, lng: swapLng };
  }

  return null;
}

/**
 * Normalize raw lat/lng: reject invalid, fix swaps, require within search radius.
 */
export function normalizeRawCoordinates(
  lat: number,
  lng: number,
  userLocation: UserLocation,
  maxRadiusMeters: number,
): { lat: number; lng: number } | null {
  if (!isPlausibleCoordinate(lat, lng)) return null;
  return tryFixSwappedCoordinates(lat, lng, userLocation, maxRadiusMeters);
}

/**
 * Coordinates from OSM Overpass or Supabase — must not be replaced by Nominatim.
 */
export function organizationHasTrustedCoordinates(org: Organization): boolean {
  if (!hasValidMapCoordinates(org)) return false;
  if (isOverpassOrganization(org)) return true;
  return /^\d+$/.test(org.id);
}

export function getOrganizationCoordinates(org: Organization): {
  lat: number;
  lng: number;
} {
  return { lat: org.lat, lng: org.lng };
}

export function coordinatesMatch(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  toleranceMiles = 0.01,
): boolean {
  return distanceMiles(a.lat, a.lng, b.lat, b.lng) <= toleranceMiles;
}

export function snapIsAcceptable(
  original: { lat: number; lng: number },
  snapped: { lat: number; lng: number },
): boolean {
  return (
    distanceMiles(original.lat, original.lng, snapped.lat, snapped.lng) <=
    MAX_ROAD_SNAP_MILES
  );
}

/**
 * Validate and normalize an organization for nearby list/map/routing.
 * Returns null when coordinates are missing, implausible, or outside search radius.
 */
export function validateOrganizationForNearby(
  org: Organization,
  userLocation: UserLocation,
  maxRadiusMeters: number,
): Organization | null {
  const normalized = normalizeRawCoordinates(
    org.lat,
    org.lng,
    userLocation,
    maxRadiusMeters,
  );
  if (!normalized) return null;

  return {
    ...org,
    lat: normalized.lat,
    lng: normalized.lng,
    distance: formatDistanceMiles(
      userLocation.lat,
      userLocation.lng,
      normalized.lat,
      normalized.lng,
    ),
  };
}

export function filterOrganizationsWithValidCoordinates(
  orgs: Organization[],
  userLocation: UserLocation,
  maxRadiusMeters: number,
): Organization[] {
  const validated: Organization[] = [];
  for (const org of orgs) {
    const next = validateOrganizationForNearby(
      org,
      userLocation,
      maxRadiusMeters,
    );
    if (next) validated.push(next);
  }
  return validated;
}

export function withDistanceFromUser(
  org: Organization,
  userLocation: UserLocation,
  formatDistance: (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) => string,
): Organization {
  const { lat, lng } = getOrganizationCoordinates(org);
  return {
    ...org,
    lat,
    lng,
    distance: formatDistance(userLocation.lat, userLocation.lng, lat, lng),
  };
}
