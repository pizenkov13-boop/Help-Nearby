import type { Organization } from "@/lib/types";
import type { SearchRadiusMode } from "@/lib/smartRadius";

const CACHE_KEY = "help-nearby-orgs-cache";
const CACHE_TTL_MS = 5 * 60 * 1000;
const LOCATION_TOLERANCE_DEG = 0.02;

export interface NearbyCachePayload {
  timestamp: number;
  lat: number;
  lng: number;
  liteMode: boolean;
  organizations: Organization[];
  searchRadiusMeters: number | null;
  searchMode: SearchRadiusMode;
  canExpand: boolean;
  nearestFallbackKm: number | null;
}

function isFresh(entry: NearbyCachePayload): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function isSameArea(
  entry: NearbyCachePayload,
  lat: number,
  lng: number,
  liteMode: boolean,
): boolean {
  if (entry.liteMode !== liteMode) return false;
  return (
    Math.abs(entry.lat - lat) < LOCATION_TOLERANCE_DEG &&
    Math.abs(entry.lng - lng) < LOCATION_TOLERANCE_DEG
  );
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

    const entry = JSON.parse(raw) as NearbyCachePayload;
    if (!isFresh(entry) || !isSameArea(entry, lat, lng, liteMode)) {
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

export function writeNearbyCache(payload: NearbyCachePayload): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[nearbyCache] write failed:", error);
  }
}
