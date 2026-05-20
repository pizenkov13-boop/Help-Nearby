import type { Organization } from "@/lib/types";

const geocodeCache = new Map<string, { lat: number; lng: number }>();

function cacheKey(org: Organization): string {
  return `${org.id}:${org.address}:${org.city}:${org.country}`;
}

function buildGeocodeQuery(org: Organization): string {
  return [org.address, org.city, org.country].filter(Boolean).join(", ").trim();
}

async function geocodeOrganization(
  org: Organization,
): Promise<{ lat: number; lng: number } | null> {
  const query = buildGeocodeQuery(org);
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve a single organization's map position via Nominatim (falls back to stored lat/lng). */
export async function resolveOrganizationCoordinates(
  org: Organization,
): Promise<Organization> {
  const coords = await geocodeOrganization(org);
  if (!coords) return org;
  return { ...org, lat: coords.lat, lng: coords.lng };
}

/** Resolve positions for map markers (rate-limited for Nominatim). */
export async function resolveOrganizationsForMap(
  orgs: Organization[],
  maxGeocode = 25,
): Promise<Organization[]> {
  const results: Organization[] = [];
  let geocoded = 0;

  for (const org of orgs) {
    if (geocoded < maxGeocode && buildGeocodeQuery(org)) {
      const resolved = await resolveOrganizationCoordinates(org);
      results.push(resolved);
      geocoded += 1;
      if (geocoded < maxGeocode) {
        await delay(1100);
      }
    } else {
      results.push(org);
    }
  }

  return results;
}
