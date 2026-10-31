import {
  buildOverpassCacheKey,
  CLIENT_CACHE_TTL_MS,
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

    if (Date.now() - entry.timestamp > CLIENT_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.organizations;
  } catch {
    return null;
  }
}

/** The key names hold a rounded (~2 km) area, so expired entries are deleted instead of lingering. */
function purgeExpiredOverpassEntries(): void {
  const now = Date.now();
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    try {
      const entry = JSON.parse(localStorage.getItem(key) ?? "null") as { timestamp?: number } | null;
      if (!entry || typeof entry.timestamp !== "number" || now - entry.timestamp > CLIENT_CACHE_TTL_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
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
    purgeExpiredOverpassEntries();
    const key = STORAGE_PREFIX + buildOverpassCacheKey(lat, lng, radiusMeters);
    localStorage.setItem(
      key,
      JSON.stringify({ timestamp: Date.now(), organizations }),
    );
  } catch (error) {
    console.warn("[overpassClientCache] write failed:", error);
  }
}

/** Deletes expired Overpass answers (called when the page opens). */
export function purgeExpiredOverpassClientCache(): void {
  if (typeof window === "undefined") return;
  try {
    purgeExpiredOverpassEntries();
  } catch {
    // storage unavailable
  }
}
