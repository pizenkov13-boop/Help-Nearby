import {
  buildOverpassCacheKey,
  OVERPASS_CACHE_TTL_MS,
} from "@/lib/overpassCache";
import type { Organization } from "@/lib/types";

const STORAGE_PREFIX = "help-nearby-overpass:";

export function readOverpassClientCache(
  lat: number,
  lng: number,
  radiusMeters: number,
): Organization[] | null {
  if (typeof window === "undefined") return null;

  try {
    const key = STORAGE_PREFIX + buildOverpassCacheKey(lat, lng, radiusMeters);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as {
      timestamp: number;
      organizations: Organization[];
    };

    if (Date.now() - entry.timestamp > OVERPASS_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.organizations;
  } catch {
    return null;
  }
}

export function writeOverpassClientCache(
  lat: number,
  lng: number,
  radiusMeters: number,
  organizations: Organization[],
): void {
  if (typeof window === "undefined") return;

  try {
    const key = STORAGE_PREFIX + buildOverpassCacheKey(lat, lng, radiusMeters);
    localStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), organizations }),
    );
  } catch (error) {
    console.warn("[overpassClientCache] write failed:", error);
  }
}
