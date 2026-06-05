import "server-only";

import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { fetchGdhoOrganizationsForCountry } from "@/lib/gdho";
import { fetchHdxOrganizationsForCountry } from "@/lib/hdx";
import { nominatimSearch } from "@/lib/nominatim.server";
import type { Organization, UserLocation } from "@/lib/types";

const SOURCE_TIMEOUT_MS = 5000;
const GEOCODE_DELAY_MS = 1100;
const MAX_GEOCODE = 12;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchWithSourceTimeout<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await Promise.race([
      fetcher(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`${label} timed out after ${SOURCE_TIMEOUT_MS}ms`)),
          SOURCE_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    console.warn(`[verifiedNearby] ${label} unavailable:`, error);
    return fallback;
  }
}

function mergeVerifiedCatalog(
  batches: Organization[][],
): Organization[] {
  const merged: Organization[] = [];

  for (const batch of batches) {
    for (const org of batch) {
      const isDuplicate = merged.some(
        (existing) => normalizeName(existing.name) === normalizeName(org.name),
      );
      if (!isDuplicate) merged.push(org);
    }
  }

  return merged;
}

function buildGeocodeQuery(org: Organization): string {
  if (org.id.startsWith("gdho-") || org.id.startsWith("hdx-")) {
    return [org.name, org.country].filter(Boolean).join(", ");
  }
  const parts = [org.name, org.address, org.city, org.country].filter(Boolean);
  return parts.join(", ");
}

async function geocodeOrganizations(
  orgs: Organization[],
): Promise<Organization[]> {
  const results: Organization[] = [];
  const toGeocode = orgs.slice(0, MAX_GEOCODE);

  for (let i = 0; i < toGeocode.length; i++) {
    const org = toGeocode[i]!;
    const query = buildGeocodeQuery(org);
    const coords = query ? await nominatimSearch(query) : null;

    if (coords) {
      results.push({ ...org, lat: coords.lat, lng: coords.lng });
    } else {
      results.push(org);
    }

    if (i < toGeocode.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, GEOCODE_DELAY_MS));
    }
  }

  results.push(...orgs.slice(MAX_GEOCODE));
  return results;
}

function filterByRadius(
  orgs: Organization[],
  location: UserLocation,
  radiusMeters: number,
): Organization[] {
  const radiusMiles = radiusMeters / 1609.34;
  return orgs.filter((org) => {
    if (!Number.isFinite(org.lat) || !Number.isFinite(org.lng)) return false;
    if (org.lat === 0 && org.lng === 0) return false;
    return (
      distanceMiles(location.lat, location.lng, org.lat, org.lng) <= radiusMiles
    );
  });
}

function sortByDistance(
  orgs: Organization[],
  location: UserLocation,
): Organization[] {
  return [...orgs]
    .map((org) => ({
      ...org,
      distance: formatDistanceMiles(
        location.lat,
        location.lng,
        org.lat,
        org.lng,
      ),
    }))
    .sort((a, b) => {
      const distA = parseFloat(a.distance) || 9999;
      const distB = parseFloat(b.distance) || 9999;
      return distA - distB;
    });
}

/**
 * HDX + GDHO organizations for a country, geocoded and filtered by radius.
 */
export async function fetchVerifiedNearbyOrganizations(
  location: UserLocation,
  radiusMeters: number,
  country: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const [hdx, gdho] = await Promise.all([
    fetchWithSourceTimeout(
      "HDX",
      () => fetchHdxOrganizationsForCountry(country, countryCode),
      [],
    ),
    fetchWithSourceTimeout(
      "GDHO",
      () => fetchGdhoOrganizationsForCountry(country),
      [],
    ),
  ]);

  const merged = mergeVerifiedCatalog([hdx, gdho]);
  if (merged.length === 0) return [];

  const geocoded = await geocodeOrganizations(merged);
  const inRadius = filterByRadius(geocoded, location, radiusMeters);
  return sortByDistance(inRadius, location);
}
