import { CLIENT_CACHE_TTL_MS } from "@/lib/overpassCache";
import type { Organization } from "@/lib/types";
import type { SearchRadiusMode } from "@/lib/smartRadius";

const CACHE_KEY = "help-nearby-orgs-cache";
const CACHE_TTL_MS = CLIENT_CACHE_TTL_MS;
/** ~2.2 km at the equator: the cache remembers an area, never the user's exact position. */
const AREA_ROUND_DEG = 0.02;

/** What is persisted. No exact coordinates: only a rounded area key. */
export interface NearbyCachePayload {
  timestamp: number;
  /** Rounded "lat:lng:mode" key of the searched area. */
  area: string;
  organizations: Organization[];
  searchRadiusMeters: number | null;
  searchMode: SearchRadiusMode;
  canExpand: boolean;
  nearestFallbackKm: number | null;
}

/** What callers pass in; the exact position is reduced to an area key before anything is stored. */
export type NearbyCacheInput = Omit<NearbyCachePayload, "area"> & {
  lat: number;
  lng: number;
  liteMode: boolean;
};

function roundToArea(value: number): string {
  return (Math.round(value / AREA_ROUND_DEG) * AREA_ROUND_DEG).toFixed(2);
}

export function nearbyAreaKey(lat: number, lng: number, liteMode: boolean): string {
  return `${roundToArea(lat)}:${roundToArea(lng)}:${liteMode ? "lite" : "full"}`;
}

function removeEntry(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // storage unavailable — nothing to remove
  }
}

export function readNearbyCache(
  lat: number,
  lng: number,
  liteMode: boolean,
): NearbyCachePayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const entry = JSON.parse(raw) as Partial<NearbyCachePayload> & {
      lat?: unknown;
      lng?: unknown;
    };

    // Old entries stored the exact position: drop them. Expired entries are deleted, not just ignored.
    const legacy = "lat" in entry || "lng" in entry;
    const expired =
      typeof entry.timestamp !== "number" ||
      Date.now() - entry.timestamp >= CACHE_TTL_MS;
    if (legacy || expired) {
      removeEntry();
      return null;
    }

    if (entry.area !== nearbyAreaKey(lat, lng, liteMode)) return null;

    return entry as NearbyCachePayload;
  } catch {
    removeEntry();
    return null;
  }
}

export function writeNearbyCache(input: NearbyCacheInput): void {
  if (typeof window === "undefined") return;

  const { lat, lng, liteMode, ...rest } = input;
  const payload: NearbyCachePayload = {
    ...rest,
    area: nearbyAreaKey(lat, lng, liteMode),
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[nearbyCache] write failed:", error);
  }
}

/** Deletes the remembered list when it is older than the cache lifetime (called when the page opens). */
export function purgeExpiredNearbyCache(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const entry = JSON.parse(raw) as { timestamp?: unknown; lat?: unknown };
    if (
      typeof entry.timestamp !== "number" ||
      Date.now() - entry.timestamp >= CACHE_TTL_MS ||
      "lat" in entry
    ) {
      removeEntry();
    }
  } catch {
    removeEntry();
  }
}
