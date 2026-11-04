import { NextResponse } from "next/server";
import { readJsonBody, toNumber } from "@/lib/apiBody.server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchNearbyOverpassOrganizations } from "@/lib/overpass.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Overpass (up to ~8.5 s) plus the Nominatim fallback must fit in one invocation.
export const maxDuration = 30;

/** Body: { lat, lng, radius? }. Nothing about the request (URL, position) is logged. */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const lat = toNumber(body.lat);
    const lng = toNumber(body.lng);
    const radius = Number.isFinite(toNumber(body.radius))
      ? toNumber(body.radius)
      : NEARBY_RADIUS_METERS;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json([]);
    }

    const organizations = await fetchNearbyOverpassOrganizations(lat, lng, radius);
    return NextResponse.json(organizations);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/nearby] Error:", message);
    // An error, not an empty list: the page then reports OSM as unavailable and retries
    // instead of showing "0 organizations found".
    const timedOut = /timeout/i.test(message);
    return NextResponse.json(
      { error: true, reason: timedOut ? "timeout" : "unavailable" },
      { status: timedOut ? 504 : 502 },
    );
  }
}
