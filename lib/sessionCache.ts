import { SEARCH_CACHE_TTL_MS } from "@/lib/ttlCache";

const PREFIX = "help-nearby-search:";

/** sessionStorage cache for search responses (5 minutes). Safe when storage is unavailable. */
export function readSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { timestamp: number; value: T };
    if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL_MS) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), value }),
    );
  } catch {
    /* quota or disabled storage — ignore */
  }
}
