import type { UserLocation } from "./types";

/** Fallback when geolocation is unavailable or denied */
export const DEFAULT_LOCATION: UserLocation = {
  lat: 40.758,
  lng: -73.9855,
};

/** Overpass + nearby Supabase search radius (10 km) */
export const NEARBY_RADIUS_METERS = 10_000;
