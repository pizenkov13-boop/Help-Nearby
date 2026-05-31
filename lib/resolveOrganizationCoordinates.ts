import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import {
  getOrganizationCoordinates,
  isOverpassOrganization,
  organizationHasTrustedCoordinates,
  snapIsAcceptable,
} from "@/lib/organizationCoordinates";
import {
  buildNominatimQuery,
  organizationNeedsGeocoding,
} from "@/lib/nominatimGeocode";
import type { Organization } from "@/lib/types";

const geocodeCache = new Map<string, { lat: number; lng: number }>();
const snapCache = new Map<string, { lat: number; lng: number }>();

function cacheKey(org: Organization): string {
  return buildNominatimQuery(org);
}

function snapCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

async function geocodeOrganization(
  org: Organization,
): Promise<{ lat: number; lng: number } | null> {
  const query = buildNominatimQuery(org);
  if (!query) return null;

  const key = cacheKey(org);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ q: query });
    const res = await fetch(`/api/geocode?${params}`);
    if (!res.ok) return null;

    const data = (await res.json()) as { lat?: number; lng?: number };
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return null;
    }

    const coords = { lat: data.lat, lng: data.lng };
    geocodeCache.set(key, coords);
    return coords;
  } catch {
    return null;
  }
}

async function fetchSnappedCoordinates(
  lat: number,
  lng: number,
): Promise<{ lat: number; lng: number } | null> {
  const key = snapCacheKey(lat, lng);
  const cached = snapCache.get(key);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    });
    const res = await fetch(`/api/nearest?${params}`);
    if (!res.ok) return null;

    const data = (await res.json()) as { lat?: number; lng?: number };
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return null;
    }

    const coords = { lat: data.lat, lng: data.lng };
    snapCache.set(key, coords);
    return coords;
  } catch (error) {
    console.warn("[resolve] road snap failed:", error);
    return null;
  }
}

/** Snap marker to nearest walking road when drift stays within tolerance. */
export async function snapOrganizationToRoad(
  org: Organization,
): Promise<Organization> {
  if (!hasValidMapCoordinates(org) || isOverpassOrganization(org)) {
    return org;
  }

  const original = getOrganizationCoordinates(org);
  const snapped = await fetchSnappedCoordinates(original.lat, original.lng);
  if (!snapped || !snapIsAcceptable(original, snapped)) {
    return org;
  }

  return { ...org, lat: snapped.lat, lng: snapped.lng };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve coordinates for routing/markers.
 * Overpass OSM coordinates are never replaced; list, map, and route share the same lat/lng.
 */
export async function resolveOrganizationCoordinates(
  org: Organization,
): Promise<Organization> {
  if (organizationHasTrustedCoordinates(org)) {
    return org;
  }

  let positioned = org;

  if (organizationNeedsGeocoding(org)) {
    const coords = await geocodeOrganization(org);
    if (coords) {
      positioned = { ...org, lat: coords.lat, lng: coords.lng };
    }
  }

  return snapOrganizationToRoad(positioned);
}

/** Refine marker positions for orgs missing coordinates (Nominatim, rate-limited). */
export async function resolveOrganizationsForMap(
  orgs: Organization[],
  maxGeocode = 40,
): Promise<Organization[]> {
  const results: Organization[] = [];
  let geocoded = 0;

  for (const org of orgs) {
    if (organizationNeedsGeocoding(org) && geocoded < maxGeocode) {
      const resolved = await resolveOrganizationCoordinates(org);
      results.push(resolved);
      geocoded += 1;
      if (geocoded < maxGeocode && geocoded < orgs.length) {
        await delay(1100);
      }
    } else {
      results.push(org);
    }
  }

  return results;
}
