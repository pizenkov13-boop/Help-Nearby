import { forwardGeocodeQuery } from "@/lib/geocode";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import {
  buildNominatimQuery,
  organizationHasGeocodableAddress,
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
    const direct = await forwardGeocodeQuery(query);
    if (direct) {
      geocodeCache.set(key, direct);
    }
    return direct;
  }
}

/** Snap marker to nearest walking road so routes meet the pin. */
export async function snapOrganizationToRoad(
  org: Organization,
): Promise<Organization> {
  if (!hasValidMapCoordinates(org)) return org;

  const key = snapCacheKey(org.lat, org.lng);
  const cached = snapCache.get(key);
  if (cached) {
    return { ...org, lat: cached.lat, lng: cached.lng };
  }

  try {
    const params = new URLSearchParams({
      lat: String(org.lat),
      lng: String(org.lng),
    });
    const res = await fetch(`/api/nearest?${params}`);
    if (!res.ok) return org;

    const data = (await res.json()) as { lat?: number; lng?: number };
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return org;
    }

    snapCache.set(key, { lat: data.lat, lng: data.lng });
    return { ...org, lat: data.lat, lng: data.lng };
  } catch (error) {
    console.warn("[resolve] road snap failed:", error);
    return org;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Nominatim address → OSRM nearest road snap.
 * Marker and route endpoint share the same snapped coordinates.
 */
export async function resolveOrganizationCoordinates(
  org: Organization,
): Promise<Organization> {
  let positioned = org;

  if (organizationHasGeocodableAddress(org)) {
    const coords = await geocodeOrganization(org);
    if (coords) {
      positioned = { ...org, lat: coords.lat, lng: coords.lng };
    }
  }

  return snapOrganizationToRoad(positioned);
}

/** Refine marker positions (Nominatim + road snap, rate-limited). */
export async function resolveOrganizationsForMap(
  orgs: Organization[],
  maxGeocode = 40,
): Promise<Organization[]> {
  const results: Organization[] = [];
  let geocoded = 0;

  for (const org of orgs) {
    if (organizationHasGeocodableAddress(org) && geocoded < maxGeocode) {
      const resolved = await resolveOrganizationCoordinates(org);
      results.push(resolved);
      geocoded += 1;
      if (geocoded < maxGeocode && geocoded < orgs.length) {
        await delay(1100);
      }
    } else {
      results.push(await snapOrganizationToRoad(org));
    }
  }

  return results;
}
