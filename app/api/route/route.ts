import { NextResponse } from "next/server";
import { readJsonBody, toNumber } from "@/lib/apiBody.server";
import { fetchSnappedWalkingRoute } from "@/lib/osrmRouting.server";
import type { RoutingMode } from "@/lib/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRoutingMode(value: unknown): value is RoutingMode {
  return value === "driving" || value === "walking";
}

/** Body: { fromLat, fromLng, toLat, toLng, mode? } with full precision; never put in the URL. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const fromLat = toNumber(body.fromLat);
  const fromLng = toNumber(body.fromLng);
  const toLat = toNumber(body.toLat);
  const toLng = toNumber(body.toLng);
  const mode: RoutingMode = isRoutingMode(body.mode) ? body.mode : "walking";

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
