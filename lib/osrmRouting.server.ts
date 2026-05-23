import "server-only";

import type { RouteData, RoutingMode } from "@/lib/routing";
import { snapToNearestWalkingRoad } from "@/lib/osrmSnap";

const USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";
const OSRM_ROUTE = "https://router.project-osrm.org/route/v1/walking";
const OSM_DE_ROUTE =
  "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

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

async function fetchRouteFromUrl(url: string): Promise<RouteData | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    console.warn("[route] provider HTTP", response.status, url.slice(0, 80));
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

  return toRouteData(data.routes[0], "walking");
}

async function fetchOsrmWalkingRoute(
  from: RoutePoint,
  to: RoutePoint,
): Promise<RouteData | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_ROUTE}/${coords}?overview=full&geometries=geojson`;
  console.log("[route] OSRM route", coords);
  return fetchRouteFromUrl(url);
}

async function fetchOsmDeFootRoute(
  from: RoutePoint,
  to: RoutePoint,
): Promise<RouteData | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSM_DE_ROUTE}/${coords}?overview=full&geometries=geojson`;
  console.log("[route] OSM.de foot route", coords);
  return fetchRouteFromUrl(url);
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

  console.log("[route] snapped", {
    from: `${from.lng},${from.lat}`,
    to: `${to.lng},${to.lat}`,
  });

  const osrm = await fetchOsrmWalkingRoute(from, to);
  if (osrm) return osrm;

  const osmDe = await fetchOsmDeFootRoute(from, to);
  if (osmDe) return osmDe;

  throw new Error("No walking route found.");
}
