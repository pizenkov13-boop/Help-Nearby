/**
 * Single source of truth for the map's raster tiles.
 * Override with NEXT_PUBLIC_MAP_TILES_URL / NEXT_PUBLIC_MAP_TILES_ATTRIBUTION
 * (e.g. MapTiler or Stadia with a key) — no code change needed.
 */

export const DEFAULT_MAP_TILES_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const DEFAULT_MAP_TILES_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const MAP_TILES_MAX_ZOOM = 19;

export interface MapTileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
}

/** Accepts only https templates that contain the {z}/{x}/{y} placeholders. */
export function isValidTileUrl(url: string): boolean {
  return (
    url.startsWith("https://") &&
    url.includes("{z}") &&
    url.includes("{x}") &&
    url.includes("{y}")
  );
}

export function getMapTileConfig(): MapTileConfig {
  // NEXT_PUBLIC_* must be read as literal property accesses so Next inlines them.
  const urlOverride = process.env.NEXT_PUBLIC_MAP_TILES_URL?.trim();
  const attributionOverride =
    process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION?.trim();

  const url =
    urlOverride && isValidTileUrl(urlOverride) ? urlOverride : DEFAULT_MAP_TILES_URL;

  return {
    url,
    attribution: attributionOverride || DEFAULT_MAP_TILES_ATTRIBUTION,
    maxZoom: MAP_TILES_MAX_ZOOM,
  };
}
