/** Tiny in-memory TTL cache (server instance or browser tab). Pure — no server-only imports. */
export interface TtlCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

export const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

export function createTtlCache<T>(ttlMs = SEARCH_CACHE_TTL_MS, maxEntries = 200): TtlCache<T> {
  const entries = new Map<string, { value: T; expiresAt: number }>();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}

/** Cache key: location rounded to ~1 km (2 decimals), radius in km, and category. */
export function searchCacheKey(
  source: string,
  lat: number,
  lng: number,
  radiusMeters: number,
  category = "all",
  country = "",
): string {
  return [
    source,
    lat.toFixed(2),
    lng.toFixed(2),
    Math.round(radiusMeters / 1000),
    category,
    country.toLowerCase(),
  ].join(":");
}

/** Races a promise against a timeout; resolves to `fallback` when time runs out. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
