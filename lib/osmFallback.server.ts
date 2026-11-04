import "server-only";

import { waitForNominatimSlot } from "@/lib/nominatim.server";
import type { OverpassElement } from "@/lib/overpass.server";

/**
 * Backup source for the same OpenStreetMap data when every Overpass mirror is overloaded:
 * Nominatim's bounded search around the position. One request per term, serialised to
 * Nominatim's 1 request/second policy, and the whole fallback stops at its own deadline.
 */
const TERMS = ["pharmacy", "hospital", "clinic", "shelter", "soup kitchen", "community centre"] as const;
const FALLBACK_BUDGET_MS = 9_000;
const REQUEST_TIMEOUT_MS = 4_000;
const USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";

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
export async function fetchNominatimElements(
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
        headers: { "User-Agent": USER_AGENT },
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
