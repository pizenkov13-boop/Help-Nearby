import "server-only";

import type { RouteData, RoutingMode } from "@/lib/routing";
import { distanceMiles } from "@/lib/geo";
import { snapToNearestWalkingRoad } from "@/lib/osrmSnap";

const USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";
// The public OSRM demo server answers every profile with its car network: walking prefers the OpenStreetMap
// foot service and uses the demo server last, with a walking pace for the time.
const OSRM_WALKING_FALLBACK = "https://router.project-osrm.org/route/v1/walking";
const OSM_DE_FOOT = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const WALKING_SPEED_MS = 1.4;

interface OsrmRouteLeg {
  distance: number;
  duration: number;
  geometry?: { coordinates?: [number, number][] };
}

interface OsrmRouteResponse {
  code?: string;
  routes?: OsrmRouteLeg[];
  message?: string;
}

interface RoutePoint {
  lng: number;
  lat: number;
}

function parseRouteGeometry(route: OsrmRouteLeg): [number, number][] {
  const raw = route.geometry?.coordinates ?? [];
  return raw.map(
    ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
  );
}

function toRouteData(route: OsrmRouteLeg, mode: RoutingMode): RouteData {
  return {
    coordinates: parseRouteGeometry(route),
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    mode,
    steps: [],
  };
}

async function fetchRouteFromUrl(
  url: string,
  mode: RoutingMode,
  walkingPace = false,
): Promise<RouteData | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    console.warn("[route] provider HTTP", response.status, new URL(url).host);
    return null;
  }

  const data = (await response.json()) as OsrmRouteResponse;

  if (data.code !== "Ok" || !data.routes?.[0]) {
    console.warn("[route] provider code", data.code, data.message);
    return null;
  }

  const coordinates = parseRouteGeometry(data.routes[0]);
  if (coordinates.length < 2) {
    return null;
  }

  const route = data.routes[0];
  return toRouteData(
    walkingPace ? { ...route, duration: route.distance / WALKING_SPEED_MS } : route,
    mode,
  );
}

/** Straight segment from the road endpoint to the exact building marker. */
function extendRouteToExactDestination(
  route: RouteData,
  exactLat: number,
  exactLng: number,
): RouteData {
  const coords = [...route.coordinates];
  if (coords.length === 0) return route;

  const last = coords[coords.length - 1]!;
  const gapMeters = distanceMiles(last[0], last[1], exactLat, exactLng) * 1609.34;

  if (gapMeters < 10) return route;

  coords.push([exactLat, exactLng]);
  const extraKm = Math.round((gapMeters / 1000) * 10) / 10;

  return {
    ...route,
    coordinates: coords,
    distanceKm: Math.round((route.distanceKm + extraKm) * 10) / 10,
  };
}

function routeUrl(base: string, from: RoutePoint, to: RoutePoint): string {
  return `${base}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
}

export async function fetchSnappedWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<RouteData> {
  const [from, to] = await Promise.all([
    snapToNearestWalkingRoad(fromLng, fromLat),
    snapToNearestWalkingRoad(toLng, toLat),
  ]);

  const foot = await fetchRouteFromUrl(routeUrl(OSM_DE_FOOT, from, to), "walking");
  if (foot) return extendRouteToExactDestination(foot, toLat, toLng);

  const demo = await fetchRouteFromUrl(routeUrl(OSRM_WALKING_FALLBACK, from, to), "walking", true);
  if (demo) return extendRouteToExactDestination(demo, toLat, toLng);

  throw new Error("No walking route found.");
}
