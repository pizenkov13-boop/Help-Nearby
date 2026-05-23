import type { UserLocation } from "./types";

/** Fallback when geolocation is unavailable or denied */
export const DEFAULT_LOCATION: UserLocation = {
  lat: 40.758,
  lng: -73.9855,
};

/** Default nearby search start radius (5 km); smart search expands up to 40 km. */
export const NEARBY_RADIUS_METERS = 5_000;

/** Lite-mode default start radius (10 km); smart search expands up to 50 km. */
export const NEARBY_RADIUS_LITE_METERS = 10_000;
