import "server-only";

import {
  searchAllSources,
  type ChatSearchDeps,
  type ChatSearchInput,
  type ChatSearchResult,
  type GeocodedPlace,
} from "@/lib/chatSearch";
import { fetchCatalogForChat } from "@/lib/data";
import {
  nominatimReverse,
  nominatimSearchDetailed,
  resolvePlaceCoordinates,
} from "@/lib/nominatim.server";
import { fetchChatOverpassForCategory } from "@/lib/overpass.server";
import { fetchVerifiedCountryDirectory } from "@/lib/verifiedNearby.server";

const GEOCODE_TIMEOUT_MS = 4000;
const GEOCODE_CACHE_TTL_MS = 60 * 60 * 1000;
const GEOCODE_CACHE_MAX = 500;

const geocodeCache = new Map<
  string,
  { value: GeocodedPlace | null; expiresAt: number }
>();

async function geocodePlace(place: string): Promise<GeocodedPlace | null> {
  const key = place.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: GeocodedPlace | null = null;
  try {
    value = await nominatimSearchDetailed(place, GEOCODE_TIMEOUT_MS);
    if (!value) {
      // Typos and Cyrillic spellings: reuse the existing multi-candidate resolver.
      const coords = await Promise.race([
        resolvePlaceCoordinates(place),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), GEOCODE_TIMEOUT_MS),
        ),
      ]);
      if (coords) {
        const reverse = await nominatimReverse(coords.lat, coords.lng).catch(
          () => null,
        );
        value = {
          ...coords,
          country: reverse?.country ?? null,
          countryCode: reverse?.countryCode ?? null,
          isCountry: false,
        };
      }
    }
  } catch {
    value = null;
  }

  // Only cache successes so a transient failure does not stick for an hour.
  if (value) {
    if (geocodeCache.size >= GEOCODE_CACHE_MAX) geocodeCache.clear();
    geocodeCache.set(key, { value, expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS });
  }
  return value;
}

const defaultDeps: ChatSearchDeps = {
  geocode: geocodePlace,
  reverse: (location) => nominatimReverse(location.lat, location.lng),
  supabase: (args) => fetchCatalogForChat(args),
  verified: (country, countryCode) =>
    fetchVerifiedCountryDirectory(country, countryCode),
  overpass: (location, category, radius) =>
    fetchChatOverpassForCategory(location.lat, location.lng, radius, category),
};

/** Searches Supabase, OCHA sources and OSM itself; logs per-source counts only. */
export async function searchForChat(
  input: ChatSearchInput,
): Promise<ChatSearchResult> {
  const result = await searchAllSources(input, defaultDeps);
  const { counts } = result;
  console.log(
    `[chat] sources: supabase=${counts.supabase} osm=${counts.osm} hdx=${counts.hdx} gdho=${counts.gdho} reliefweb=${counts.reliefweb} geocoded=${result.place ? "yes" : "no"} returned=${result.organizations.length}`,
  );
  return result;
}
