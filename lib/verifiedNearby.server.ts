import "server-only";

import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { fetchGdhoOrganizationsForCountry } from "@/lib/gdho";
import { fetchHdxOrganizationsForCountry } from "@/lib/hdx";
import { fetchReliefWebOrganizationsForCountry } from "@/lib/reliefweb";
import { nominatimSearch } from "@/lib/nominatim.server";
import type { Organization, UserLocation } from "@/lib/types";

const SOURCE_TIMEOUT_MS = 5000;
const OCHA_SOURCE_TIMEOUT_MS = 15_000;
const GEOCODE_DELAY_MS = 1100;
const MAX_GEOCODE = 12;
const GEOCODE_PER_OCHA_SOURCE = 4;
/** Country-wide OCHA orgs shown even outside search radius (per source). */
const MAX_OCHA_COUNTRY_WIDE_PER_SOURCE = 8;

function isUkraine(country: string, countryCode?: string | null): boolean {
  if (countryCode?.trim().toUpperCase() === "UA") return true;
  return country.trim().toLowerCase() === "ukraine";
}

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
  timeoutMs = SOURCE_TIMEOUT_MS,
): Promise<T> {
  try {
    return await Promise.race([
      fetcher(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
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
  if (
    org.id.startsWith("gdho-") ||
    org.id.startsWith("hdx-") ||
    org.id.startsWith("rw-")
  ) {
    return [org.name, org.country].filter(Boolean).join(", ");
  }
  const parts = [org.name, org.address, org.city, org.country].filter(Boolean);
  return parts.join(", ");
}

function isOchaOrganization(org: Organization): boolean {
  return (
    org.id.startsWith("rw-") ||
    org.id.startsWith("hdx-") ||
    org.id.startsWith("gdho-")
  );
}

function selectOrganizationsToGeocode(orgs: Organization[]): Organization[] {
  const reliefweb = orgs.filter((org) => org.id.startsWith("rw-"));
  const hdx = orgs.filter((org) => org.id.startsWith("hdx-"));
  const gdho = orgs.filter((org) => org.id.startsWith("gdho-"));
  const other = orgs.filter((org) => !isOchaOrganization(org));

  const picked = [
    ...reliefweb.slice(0, GEOCODE_PER_OCHA_SOURCE),
    ...hdx.slice(0, GEOCODE_PER_OCHA_SOURCE),
    ...gdho.slice(0, GEOCODE_PER_OCHA_SOURCE),
    ...other,
  ].slice(0, MAX_GEOCODE);

  const pickedIds = new Set(picked.map((org) => org.id));
  const remainder = orgs.filter((org) => !pickedIds.has(org.id));
  return [...picked, ...remainder];
}

function hasValidCoordinates(org: Organization): boolean {
  return (
    Number.isFinite(org.lat) &&
    Number.isFinite(org.lng) &&
    !(org.lat === 0 && org.lng === 0)
  );
}

function ochaSourceKey(org: Organization): "rw" | "hdx" | "gdho" | null {
  if (org.id.startsWith("rw-")) return "rw";
  if (org.id.startsWith("hdx-")) return "hdx";
  if (org.id.startsWith("gdho-")) return "gdho";
  return null;
}

async function geocodeOrganizations(
  orgs: Organization[],
): Promise<Organization[]> {
  const ordered = selectOrganizationsToGeocode(orgs);
  const toGeocode = ordered.slice(0, MAX_GEOCODE);
  const geocodedIds = new Set<string>();
  const results: Organization[] = [];

  for (let i = 0; i < toGeocode.length; i++) {
    const org = toGeocode[i]!;
    const query = buildGeocodeQuery(org);
    const coords = query ? await nominatimSearch(query) : null;
    const updated = coords ? { ...org, lat: coords.lat, lng: coords.lng } : org;
    results.push(updated);
    geocodedIds.add(org.id);

    if (i < toGeocode.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, GEOCODE_DELAY_MS));
    }
  }

  for (const org of ordered.slice(MAX_GEOCODE)) {
    if (!geocodedIds.has(org.id)) {
      results.push(org);
    }
  }

  return results;
}

/**
 * OCHA catalogs are country-level: keep in-radius hits plus the nearest
 * country-wide organizations per source so ReliefWeb/HDX/GDHO appear on the map.
 */
function filterForNearbySearch(
  orgs: Organization[],
  location: UserLocation,
  radiusMeters: number,
): Organization[] {
  const radiusMiles = radiusMeters / 1609.34;
  const inRadius: Organization[] = [];
  const outOfRadiusBySource: Record<"rw" | "hdx" | "gdho", Array<{ org: Organization; dist: number }>> = {
    rw: [],
    hdx: [],
    gdho: [],
  };

  for (const org of orgs) {
    if (!hasValidCoordinates(org)) continue;

    const dist = distanceMiles(location.lat, location.lng, org.lat, org.lng);
    const source = ochaSourceKey(org);

    if (!source) {
      if (dist <= radiusMiles) inRadius.push(org);
      continue;
    }

    if (dist <= radiusMiles) {
      inRadius.push(org);
    } else {
      outOfRadiusBySource[source].push({ org, dist });
    }
  }

  const countryWide: Organization[] = [];
  const seen = new Set(inRadius.map((org) => org.id));

  for (const source of ["rw", "hdx", "gdho"] as const) {
    const nearest = outOfRadiusBySource[source]
      .sort((a, b) => a.dist - b.dist)
      .slice(0, MAX_OCHA_COUNTRY_WIDE_PER_SOURCE);

    for (const { org } of nearest) {
      if (seen.has(org.id)) continue;
      seen.add(org.id);
      countryWide.push(org);
    }
  }

  return [...inRadius, ...countryWide];
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
 * HDX + GDHO + ReliefWeb organizations for a country, geocoded and filtered by radius.
 */
export async function fetchVerifiedNearbyOrganizations(
  location: UserLocation,
  radiusMeters: number,
  country: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const skipReliefWeb = isUkraine(country, countryCode);

  const [hdx, gdho, reliefweb] = await Promise.all([
    fetchWithSourceTimeout(
      "HDX",
      () => fetchHdxOrganizationsForCountry(country, countryCode),
      [],
      OCHA_SOURCE_TIMEOUT_MS,
    ),
    fetchWithSourceTimeout(
      "GDHO",
      () => fetchGdhoOrganizationsForCountry(country),
      [],
      OCHA_SOURCE_TIMEOUT_MS,
    ),
    skipReliefWeb
      ? Promise.resolve([])
      : fetchWithSourceTimeout(
          "ReliefWeb",
          () => fetchReliefWebOrganizationsForCountry(country, countryCode),
          [],
          15_000,
        ),
  ]);

  const merged = mergeVerifiedCatalog([reliefweb, hdx, gdho]);
  if (merged.length === 0) return [];

  const geocoded = await geocodeOrganizations(merged);
  const filtered = filterForNearbySearch(geocoded, location, radiusMeters);
  return sortByDistance(filtered, location);
}
