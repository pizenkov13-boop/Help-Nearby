/** Shared Overpass cache settings (client localStorage + server memory). */
export const OVERPASS_CACHE_TTL_MS = 60 * 60 * 1000;

export const OVERPASS_TIMEOUT_MS = 20_000;

/** ~2.2 km at equator — same bucket as nearby list cache. */
export const OVERPASS_LOCATION_ROUND_DEG = 0.02;

export function roundCoordinate(value: number): number {
  return Math.round(value / OVERPASS_LOCATION_ROUND_DEG) * OVERPASS_LOCATION_ROUND_DEG;
}

export function buildOverpassCacheKey(
  lat: number,
  lng: number,
  radiusMeters: number,
): string {
  const latKey = roundCoordinate(lat).toFixed(3);
  const lngKey = roundCoordinate(lng).toFixed(3);
  const radiusKey = Math.round(radiusMeters / 1000);
  return `overpass:${latKey}:${lngKey}:${radiusKey}km`;
}
