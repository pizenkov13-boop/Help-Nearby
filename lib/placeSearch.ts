import { createTtlCache } from "@/lib/ttlCache";

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  countryCode: string | null;
}

export type PlaceSearchOutcome =
  | { status: "ok"; places: PlaceResult[] }
  | { status: "error" };

export const PLACE_AUTOCOMPLETE_MIN_CHARS = 3;
export const PLACE_AUTOCOMPLETE_DEBOUNCE_MS = 400;
export const PLACE_AUTOCOMPLETE_MAX = 5;

const clientCache = createTtlCache<PlaceResult[]>(30 * 60 * 1000, 200);

function isPlace(value: unknown): value is PlaceResult {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

/** Geocodes free text through /api/geocode (server caches and enforces Nominatim limits). */
export async function fetchPlaces(
  query: string,
  limit: number,
  language: string,
  signal?: AbortSignal,
): Promise<PlaceSearchOutcome> {
  const q = query.trim();
  if (!q) return { status: "ok", places: [] };

  const key = `${language}|${limit}|${q.toLowerCase()}`;
  const cached = clientCache.get(key);
  if (cached) return { status: "ok", places: cached };

  try {
    const params = new URLSearchParams({ q, limit: String(limit), lang: language });
    const res = await fetch(`/api/geocode?${params}`, { signal });
    if (!res.ok) return { status: "error" };

    const data = (await res.json()) as { results?: unknown[] };
    const places = (data.results ?? []).filter(isPlace).slice(0, limit);
    clientCache.set(key, places);
    return { status: "ok", places };
  } catch {
    return { status: "error" };
  }
}
