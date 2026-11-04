import "server-only";

import { OSM_USER_AGENT } from "@/lib/constants";
import { waitForNominatimSlot } from "@/lib/nominatim.server";
import { buildOverpassCacheKey } from "@/lib/overpassCache";
import type { OverpassElement } from "@/lib/overpass.server";

/**
 * Backup source for the same OpenStreetMap data when every Overpass mirror is overloaded:
 * Nominatim's bounded search around the position. Usage policy: one request per term, all of
 * them serialised to 1 request/second (waitForNominatimSlot, shared with geocoding), a generic
 * User-Agent, identical concurrent searches share one run, at most MAX_RUNS run at once, and the
 * answer is cached on the server by rounded position and radius, so neither Nominatim nor
 * Overpass is hit again for the same area.
 */
const TERMS = ["pharmacy", "hospital", "clinic", "shelter", "soup kitchen", "community centre"] as const;
const FALLBACK_BUDGET_MS = 9_000;
const REQUEST_TIMEOUT_MS = 4_000;

/** Fallback answers are cached for 6 h; Overpass is tried again at most every 10 min meanwhile. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const OVERPASS_RETRY_MS = 10 * 60 * 1000;
/** Both sources failed: do not retry that area for a minute. */
const FAILURE_TTL_MS = 60 * 1000;
const MAX_RUNS = 2;

interface CacheEntry {
  elements: OverpassElement[];
  expiresAt: number;
  overpassRetryAt: number;
}

const cache = new Map<string, CacheEntry>();
const failedUntil = new Map<string, number>();
const inflight = new Map<string, Promise<OverpassElement[] | null>>();
let activeRuns = 0;

function areaKey(lat: number, lng: number, radius: number): string {
  return buildOverpassCacheKey(lat, lng, radius);
}

function liveEntry(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry;
}

/** True while a cached fallback answer exists and Overpass was tried recently: skip Overpass. */
export function hasFreshFallback(lat: number, lng: number, radius: number): boolean {
  const entry = liveEntry(areaKey(lat, lng, radius));
  return entry !== null && Date.now() < entry.overpassRetryAt;
}

/** True when both sources failed for this area within the last minute. */
export function hasRecentFailure(lat: number, lng: number, radius: number): boolean {
  const until = failedUntil.get(areaKey(lat, lng, radius));
  return until !== undefined && Date.now() < until;
}

/** NOMINATIM_SEARCH_URL replaces the endpoint; used by the e2e tests. */
function searchUrl(): string {
  return process.env.NOMINATIM_SEARCH_URL?.trim() || "https://nominatim.openstreetmap.org/search";
}

interface NominatimItem {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  category?: string;
  type?: string;
  extratags?: Record<string, string> | null;
}

function viewbox(lat: number, lng: number, radius: number): string {
  const dLat = radius / 111_320;
  const dLng = radius / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return [lng - dLng, lat + dLat, lng + dLng, lat - dLat].map((v) => v.toFixed(5)).join(",");
}

function toElement(item: NominatimItem): OverpassElement | null {
  const type = item.osm_type;
  if (type !== "node" && type !== "way" && type !== "relation") return null;
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  if (item.osm_id == null || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const tags: Record<string, string> = { ...(item.extratags ?? {}) };
  if (item.category && item.type) tags[item.category] = item.type;
  if (item.name) tags.name = item.name;
  return { type, id: item.osm_id, lat, lon, tags };
}

/** Elements shaped like Overpass output, so the normal mapping and cleanup apply. null = unavailable. */
export function fetchNominatimElements(
  lat: number,
  lng: number,
  radius: number,
): Promise<OverpassElement[] | null> {
  const key = areaKey(lat, lng, radius);

  const cached = liveEntry(key);
  if (cached) {
    cached.overpassRetryAt = Date.now() + OVERPASS_RETRY_MS;
    return Promise.resolve(cached.elements);
  }
  if (hasRecentFailure(lat, lng, radius)) return Promise.resolve(null);

  const running = inflight.get(key);
  if (running) return running;
  if (activeRuns >= MAX_RUNS) return Promise.resolve(null);

  activeRuns += 1;
  const run = searchNominatim(lat, lng, radius)
    .then((elements) => {
      if (elements && elements.length > 0) {
        cache.set(key, {
          elements,
          expiresAt: Date.now() + CACHE_TTL_MS,
          overpassRetryAt: Date.now() + OVERPASS_RETRY_MS,
        });
        failedUntil.delete(key);
        return elements;
      }
      failedUntil.set(key, Date.now() + FAILURE_TTL_MS);
      return elements;
    })
    .finally(() => {
      activeRuns -= 1;
      inflight.delete(key);
    });
  inflight.set(key, run);
  return run;
}

async function searchNominatim(
  lat: number,
  lng: number,
  radius: number,
): Promise<OverpassElement[] | null> {
  const deadline = Date.now() + FALLBACK_BUDGET_MS;
  const seen = new Set<string>();
  const elements: OverpassElement[] = [];
  let answered = false;

  for (const term of TERMS) {
    if (Date.now() + REQUEST_TIMEOUT_MS > deadline && answered) break;
    await waitForNominatimSlot();
    const url = new URL(searchUrl());
    url.searchParams.set("q", term);
    url.searchParams.set("viewbox", viewbox(lat, lng, radius));
    url.searchParams.set("bounded", "1");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "40");
    url.searchParams.set("extratags", "1");
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": OSM_USER_AGENT },
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, Math.max(deadline - Date.now(), 500))),
      });
      if (!response.ok) continue;
      const items = (await response.json()) as NominatimItem[];
      answered = true;
      for (const item of items) {
        const element = toElement(item);
        if (!element) continue;
        const key = `${element.type}:${element.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        elements.push(element);
      }
    } catch (error) {
      console.warn("[osm-fallback]", term, error instanceof Error ? error.message : error);
    }
  }
  return answered ? elements : null;
}
