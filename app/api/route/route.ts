import { NextResponse } from "next/server";
import { fetchSnappedWalkingRoute } from "@/lib/osrmRouting.server";
import type { RoutingMode } from "@/lib/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRoutingMode(value: string | null): value is RoutingMode {
  return value === "driving" || value === "walking";
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

  if (mode !== "walking") {
    return NextResponse.json(
      { error: "Only walking routes are supported." },
      { status: 400 },
    );
  }

  try {
    const route = await fetchSnappedWalkingRoute(
      fromLat,
      fromLng,
      toLat,
      toLng,
    );
    return NextResponse.json(route);
  } catch (error) {
    console.error("[api/route]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch route.",
      },
      { status: 502 },
    );
  }
}
