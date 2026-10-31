import "server-only";

import { createTtlCache } from "@/lib/ttlCache";

/** Nominatim search — server-side only (Nominatim usage policy). */
export async function nominatimSearch(
  query: string,
  options?: { countryCodes?: string; language?: string },
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  if (options?.countryCodes) {
    url.searchParams.set("countrycodes", options.countryCodes);
  }
  if (options?.language) {
    url.searchParams.set("accept-language", options.language);
  }

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { lat: string; lon: string }[];
  const first = data[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

/**
 * Reverse geocode coordinates to country and a short place label ("district, city") — server-side
 * only (Nominatim usage policy). The label is what the page shows as "Results near: ...".
 */
export async function nominatimReverse(
  lat: number,
  lng: number,
  language?: string,
): Promise<{ country: string; countryCode: string | null; place: string | null } | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "14");
  if (language && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(language)) {
    url.searchParams.set("accept-language", language);
  }

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    address?: Record<string, string | undefined>;
  };

  const address = data.address;
  const country = address?.country;
  if (!address || !country) return null;

  const city =
    address.city ?? address.town ?? address.village ?? address.municipality ?? address.county;
  const district = address.suburb ?? address.city_district ?? address.neighbourhood;
  const place = district && city && district !== city ? `${district}, ${city}` : (city ?? district ?? null);

  return {
    country,
    countryCode: address.country_code?.toUpperCase() ?? null,
    place,
  };
}

async function photonSearch(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", "1");
  url.searchParams.set("lang", "default");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    features?: { geometry?: { coordinates?: [number, number] } }[];
  };
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) return null;

  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

/** Fallback when geocoding APIs fail (OSM-verified coordinates). */
const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  прокопьевск: { lat: 53.8863, lng: 86.7173 },
  prokopyevsk: { lat: 53.8863, lng: 86.7173 },
  москва: { lat: 55.7558, lng: 37.6173 },
  moscow: { lat: 55.7558, lng: 37.6173 },
  "saint petersburg": { lat: 59.9311, lng: 30.3609 },
  "санкт петербург": { lat: 59.9311, lng: 30.3609 },
  "новосибирск": { lat: 55.0084, lng: 82.9357 },
  novosibirsk: { lat: 55.0084, lng: 82.9357 },
  "нью йорк": { lat: 40.7128, lng: -74.006 },
  "нью йорке": { lat: 40.7128, lng: -74.006 },
  "new york": { lat: 40.7128, lng: -74.006 },
  "new york city": { lat: 40.7128, lng: -74.006 },
};

function lookupKnownCity(placeQuery: string): { lat: number; lng: number } | null {
  const normalized = placeQuery
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (KNOWN_CITY_COORDINATES[normalized]) {
    return KNOWN_CITY_COORDINATES[normalized];
  }

  const firstToken = normalized.split(" ")[0] ?? "";
  if (firstToken && KNOWN_CITY_COORDINATES[firstToken]) {
    return KNOWN_CITY_COORDINATES[firstToken];
  }

  for (const [name, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (normalized.includes(name) || name.includes(firstToken)) {
      return coords;
    }
  }

  return null;
}

function buildPlaceCandidates(placeQuery: string): string[] {
  const candidates = new Set<string>();
  const trimmed = placeQuery.trim();
  if (!trimmed) return [];

  candidates.add(trimmed);

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token.length > 5) candidates.add(token.slice(0, -1));
    if (token.length > 6) candidates.add(token.slice(0, -2));
    if (token.length > 7) candidates.add(token.slice(0, -3));
  }

  const hasCyrillic = /[\u0400-\u04FF]/.test(trimmed);
  if (hasCyrillic && !lookupKnownCity(trimmed)) {
    for (const base of [...candidates]) {
      if (!base.includes(",") && !lookupKnownCity(base)) {
        candidates.add(`${base}, Россия`);
        candidates.add(`${base}, Russia`);
      }
    }
  }

  return [...candidates];
}

/** Try several spellings — handles typos like «прокопьевскен». */
export async function resolvePlaceCoordinates(
  placeQuery: string,
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = placeQuery.trim();
  if (trimmed.length < 4) {
    return lookupKnownCity(trimmed);
  }

  const known = lookupKnownCity(placeQuery);
  if (known) return known;

  const candidates = buildPlaceCandidates(placeQuery);
  const hasCyrillic = /[\u0400-\u04FF]/.test(placeQuery);
  const nominatimOptions = hasCyrillic
    ? { countryCodes: "ru", language: "ru" }
    : undefined;

  for (const candidate of candidates) {
    const coords = await nominatimSearch(candidate, nominatimOptions);
    if (coords) return coords;
  }

  for (const candidate of candidates) {
    const coords = await photonSearch(candidate);
    if (coords) return coords;
  }

  return lookupKnownCity(candidates[0] ?? placeQuery);
}

let nextSlot = 0;

/** Serialises calls so we stay under Nominatim's 1 request/second policy. */
async function waitForNominatimSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + 1100;
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
}

/** Forward geocode with country details (used by the AI chat). */
export async function nominatimSearchDetailed(
  query: string,
  timeoutMs: number,
): Promise<{
  lat: number;
  lng: number;
  country: string | null;
  countryCode: string | null;
  isCountry: boolean;
} | null> {
  if (!query.trim()) return null;
  await waitForNominatimSlot();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    lat: string;
    lon: string;
    addresstype?: string;
    address?: { country?: string; country_code?: string };
  }[];
  const first = data[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    country: first.address?.country ?? null,
    countryCode: first.address?.country_code?.toUpperCase() ?? null,
    isCountry: first.addresstype === "country",
  };
}

export interface PlaceSuggestion {
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  countryCode: string | null;
}

const placeCache = createTtlCache<PlaceSuggestion[]>(60 * 60 * 1000, 500);

/**
 * Place autocomplete / forward geocoding with up to `limit` results.
 * Cached for an hour and serialised to Nominatim's 1 request/second policy.
 */
export async function nominatimSearchPlaces(
  query: string,
  limit: number,
  language = "en",
  timeoutMs = 4000,
): Promise<PlaceSuggestion[] | null> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];

  const count = Math.min(Math.max(limit, 1), 5);
  const key = `${language}|${count}|${q.toLowerCase()}`;
  const cached = placeCache.get(key);
  if (cached) return cached;

  await waitForNominatimSlot();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(count));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", language);

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    lat: string;
    lon: string;
    name?: string;
    display_name?: string;
    address?: { country?: string; country_code?: string };
  }[];

  const results: PlaceSuggestion[] = [];
  for (const item of data) {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const head = item.name || item.display_name?.split(",")[0]?.trim() || q;
    const country = item.address?.country ?? null;
    results.push({
      name: country && !head.includes(country) ? `${head}, ${country}` : head,
      lat,
      lng,
      country,
      countryCode: item.address?.country_code?.toUpperCase() ?? null,
    });
  }

  // Cache empty answers too (short-lived by the cache TTL) so repeated typos stay cheap.
  placeCache.set(key, results);
  return results;
}
