import "server-only";

import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { fetchGdhoOrganizationsForCountry } from "@/lib/gdho";
import { fetchHdxOrganizationsForCountry } from "@/lib/hdx";
import { nominatimSearch } from "@/lib/nominatim.server";
import type { Organization, UserLocation } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;
const GEOCODE_DELAY_MS = 1100;
const MAX_GEOCODE = 40;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mergeHdxAndGdho(hdx: Organization[], gdho: Organization[]): Organization[] {
  const merged = [...hdx];

  for (const org of gdho) {
    const isDuplicate = merged.some(
      (existing) => normalizeName(existing.name) === normalizeName(org.name),
    );
    if (!isDuplicate) merged.push(org);
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
 * HDX (UN OCHA) + GDHO organizations for a country, geocoded and filtered by radius.
 */
export async function fetchVerifiedNearbyOrganizations(
  location: UserLocation,
  radiusMeters: number,
  country: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const [hdx, gdho] = await Promise.all([
    fetchHdxOrganizationsForCountry(country, countryCode),
    fetchGdhoOrganizationsForCountry(country),
  ]);

  const merged = mergeHdxAndGdho(hdx, gdho);
  if (merged.length === 0) return [];

  const geocoded = await geocodeOrganizations(merged);
  const inRadius = filterByRadius(geocoded, location, radiusMeters);
  return sortByDistance(inRadius, location);
}
