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
    distanceKm: route.distance / 1000,
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

/** Add short segments between the real locations and the routed road endpoints. */
function extendRouteToExactEndpoints(
  route: RouteData,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): RouteData {
  const coords = [...route.coordinates];
  if (coords.length === 0) return route;
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const startGap = distanceMiles(first[0], first[1], fromLat, fromLng) * 1609.344;
  const endGap = distanceMiles(last[0], last[1], toLat, toLng) * 1609.344;
  if (startGap > 300 || endGap > 300) throw new Error("Route endpoint is too far from the requested location.");
  const extraMeters = (startGap >= 10 ? startGap : 0) + (endGap >= 10 ? endGap : 0);
  if (startGap >= 10) coords.unshift([fromLat, fromLng]);
  if (endGap >= 10) coords.push([toLat, toLng]);
  return {
    ...route,
    coordinates: coords,
    distanceKm: route.distanceKm + extraMeters / 1000,
    durationMinutes: Math.max(1, Math.round(route.durationMinutes + extraMeters / WALKING_SPEED_MS / 60)),
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

  const foot = await fetchRouteFromUrl(routeUrl(OSM_DE_FOOT, from, to), "walking").catch((error) => {
    console.warn("[route] walking provider unavailable:", error instanceof Error ? error.message : "request failed");
    return null;
  });
  if (foot) return extendRouteToExactEndpoints(foot, fromLat, fromLng, toLat, toLng);

  const demo = await fetchRouteFromUrl(routeUrl(OSRM_WALKING_FALLBACK, from, to), "walking", true);
  if (demo) return extendRouteToExactEndpoints(demo, fromLat, fromLng, toLat, toLng);

  throw new Error("No walking route found.");
}
