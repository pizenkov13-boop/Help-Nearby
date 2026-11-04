// There is deliberately no default location: without geolocation or a typed city, nothing is searched.

/** Shared User-Agent for OpenStreetMap services: names the app, carries no personal data. */
export const OSM_USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";

/** Default nearby search start radius (5 km); smart search expands up to 40 km. */
export const NEARBY_RADIUS_METERS = 5_000;

/** Lite-mode default start radius (10 km); smart search expands up to 50 km. */
export const NEARBY_RADIUS_LITE_METERS = 10_000;
