import { NextResponse } from "next/server";
import { getOsrmProfile, type RoutingMode } from "@/lib/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

function isRoutingMode(value: string | null): value is RoutingMode {
  return value === "driving" || value === "walking";
}

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }[];
  message?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));
  const modeParam = searchParams.get("mode");
  const mode: RoutingMode = isRoutingMode(modeParam) ? modeParam : "walking";

  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLng) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLng)
  ) {
    return NextResponse.json(
      { error: "fromLat, fromLng, toLat, and toLng are required." },
      { status: 400 },
    );
  }

  const profile = getOsrmProfile(mode);
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const url = `${OSRM_BASE}/${profile}/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OSRM error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as OsrmRouteResponse;

    if (data.code !== "Ok" || !data.routes?.[0]) {
      return NextResponse.json(
        { error: data.message ?? "No route found." },
        { status: 404 },
      );
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number],
    );

    return NextResponse.json({
      coordinates,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      mode,
      steps: [],
    });
  } catch (error) {
    console.error("[api/route]", error);
    return NextResponse.json(
      { error: "Failed to fetch route." },
      { status: 502 },
    );
  }
}
