import "server-only";

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
  "novosibirsk": { lat: 55.0084, lng: 82.9357 },
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
  if (hasCyrillic) {
    for (const base of [...candidates]) {
      if (!base.includes(",")) {
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
