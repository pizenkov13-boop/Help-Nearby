import { mergeOrganizations } from "@/lib/mergeOrganizations";
import type { Category, Organization, UserLocation } from "@/lib/types";

/** Pure (no server-only imports) so it can be unit-tested with injected sources. */

export type SourceLabel = "Supabase" | "OSM" | "HDX" | "GDHO" | "ReliefWeb";

const SOURCE_RANK: Record<SourceLabel, number> = {
  Supabase: 0,
  OSM: 1,
  HDX: 2,
  GDHO: 2,
  ReliefWeb: 2,
};

export const CHAT_SEARCH_TIMEOUT_MS = 6000;
export const CHAT_SEARCH_MAX_RESULTS = 10;
export const CHAT_OVERPASS_RADIUS_METERS = 8000;

export interface GeocodedPlace {
  lat: number;
  lng: number;
  country: string | null;
  countryCode: string | null;
  /** True when the query itself is a country (no point searching OSM around its centroid). */
  isCountry: boolean;
}

export interface ChatSearchDeps {
  geocode(place: string): Promise<GeocodedPlace | null>;
  reverse(
    location: UserLocation,
  ): Promise<{ country: string; countryCode: string | null } | null>;
  supabase(args: {
    country: string | null;
    city: string | null;
    category: Category | null;
    location: UserLocation | null;
  }): Promise<Organization[]>;
  /** HDX + GDHO + ReliefWeb for a country, as three labelled batches. */
  verified(
    country: string,
    countryCode: string | null,
  ): Promise<{ hdx: Organization[]; gdho: Organization[]; reliefweb: Organization[] }>;
  overpass(
    location: UserLocation,
    category: Category,
    radiusMeters: number,
  ): Promise<Organization[]>;
}

export interface ChatSearchInput {
  place: string | null;
  category: Category | null;
  clientLocation: UserLocation | null;
  clientCountry: string | null;
}

export interface ChatSearchOrg {
  name: string;
  category: string;
  city: string;
  country: string;
  phone: string;
  website: string;
  verified: boolean;
  source: SourceLabel;
  distance: string;
  /** OCHA entries are country-level: exact office address is not confirmed. */
  countryLevel: boolean;
  /** Set when the entry only came from the page's own results (origin not tracked). */
  fromPage?: boolean;
}

export interface ChatSearchResult {
  organizations: ChatSearchOrg[];
  /** Raw result counts per source (before merge/dedupe), for logging only. */
  counts: Record<"supabase" | "osm" | "hdx" | "gdho" | "reliefweb", number>;
  place: GeocodedPlace | null;
  country: string | null;
  searched: boolean;
}

async function settle<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function distanceValue(distance: string): number {
  const match = distance.match(/^([\d.]+)\s*(mi|ft)?/i);
  if (!match) return 9999;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "ft" ? value / 5280 : value;
}

export async function searchAllSources(
  input: ChatSearchInput,
  deps: ChatSearchDeps,
  options: { timeoutMs?: number; limit?: number } = {},
): Promise<ChatSearchResult> {
  const timeoutMs = options.timeoutMs ?? CHAT_SEARCH_TIMEOUT_MS;
  const limit = options.limit ?? CHAT_SEARCH_MAX_RESULTS;
  const counts = { supabase: 0, osm: 0, hdx: 0, gdho: 0, reliefweb: 0 };

  // 1. Resolve the place to coordinates + country (client coordinates are the fallback).
  let place: GeocodedPlace | null = null;
  let location: UserLocation | null = null;
  let country: string | null = null;
  let countryCode: string | null = null;

  if (input.place) {
    place = await settle(deps.geocode(input.place), null, timeoutMs);
    if (place) {
      location = { lat: place.lat, lng: place.lng };
      country = place.country;
      countryCode = place.countryCode;
    }
  } else if (input.clientLocation) {
    location = input.clientLocation;
  }

  if (!country && !input.place && input.clientCountry) {
    country = input.clientCountry;
  }
  if (!country && location) {
    const reverse = await settle(deps.reverse(location), null, timeoutMs);
    if (reverse) {
      country = reverse.country;
      countryCode = reverse.countryCode;
    }
  }

  const searched = Boolean(input.place || location || country);
  if (!searched) {
    return { organizations: [], counts, place, country, searched };
  }

  // 2. Query every source in parallel; each fails independently.
  const city = !country ? input.place : null;
  const emptyVerified = { hdx: [], gdho: [], reliefweb: [] };

  const [supabase, verified, overpass] = await Promise.all([
    settle(
      deps.supabase({ country, city, category: input.category, location }),
      [] as Organization[],
      timeoutMs,
    ),
    country
      ? settle(deps.verified(country, countryCode), emptyVerified, timeoutMs)
      : Promise.resolve(emptyVerified),
    location && input.category && !place?.isCountry
      ? settle(
          deps.overpass(location, input.category, CHAT_OVERPASS_RADIUS_METERS),
          [] as Organization[],
          timeoutMs,
        )
      : Promise.resolve([] as Organization[]),
  ]);

  // Pharmacies are only relevant when the user asked for medical help.
  const osm =
    input.category === "medical"
      ? overpass
      : overpass.filter((org) => !/\bpharmacy\b/i.test(org.description));

  counts.supabase = supabase.length;
  counts.osm = osm.length;
  counts.hdx = verified.hdx.length;
  counts.gdho = verified.gdho.length;
  counts.reliefweb = verified.reliefweb.length;

  // 3. Merge (Supabase wins duplicates, then OSM, then OCHA), tag sources, cap at `limit`.
  const labels = new Map<Organization, SourceLabel>();
  for (const org of supabase) labels.set(org, "Supabase");
  for (const org of osm) labels.set(org, "OSM");
  for (const org of verified.hdx) labels.set(org, "HDX");
  for (const org of verified.gdho) labels.set(org, "GDHO");
  for (const org of verified.reliefweb) labels.set(org, "ReliefWeb");

  const merged = mergeOrganizations(supabase, [
    ...osm,
    ...verified.reliefweb,
    ...verified.hdx,
    ...verified.gdho,
  ]);

  const ranked = merged
    .map((org) => ({ org, source: labels.get(org) ?? ("Supabase" as SourceLabel) }))
    .sort((a, b) => {
      const rank = SOURCE_RANK[a.source] - SOURCE_RANK[b.source];
      if (rank !== 0) return rank;
      return distanceValue(a.org.distance) - distanceValue(b.org.distance);
    })
    .slice(0, limit);

  const organizations = ranked.map(({ org, source }) => ({
    name: org.name,
    category: org.category,
    city: org.city,
    country: org.country,
    phone: org.phone,
    website: org.website,
    verified: org.verified,
    source,
    distance: location ? org.distance : "",
    countryLevel: SOURCE_RANK[source] === 2,
  }));

  return { organizations, counts, place, country, searched };
}
