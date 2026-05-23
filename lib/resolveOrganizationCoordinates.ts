import { forwardGeocodeQuery } from "@/lib/geocode";
import {
  buildNominatimQuery,
  organizationHasGeocodableAddress,
} from "@/lib/nominatimGeocode";
import type { Organization } from "@/lib/types";

const geocodeCache = new Map<string, { lat: number; lng: number }>();

function cacheKey(org: Organization): string {
  return buildNominatimQuery(org);
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve map position via Nominatim address search (preferred over stored lat/lng). */
export async function resolveOrganizationCoordinates(
  org: Organization,
): Promise<Organization> {
  if (!organizationHasGeocodableAddress(org)) {
    return org;
  }

  const coords = await geocodeOrganization(org);
  if (!coords) return org;
  return { ...org, lat: coords.lat, lng: coords.lng };
}

/** Refine marker positions from addresses (Nominatim, rate-limited). */
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
      results.push(org);
    }
  }

  return results;
}
