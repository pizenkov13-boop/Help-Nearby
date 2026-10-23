import { NextResponse } from "next/server";
import { readJsonBody, toNumber } from "@/lib/apiBody.server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { loadEmergencyOrganizations } from "@/lib/loadEmergencyOrganizations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { lat, lng, radius? } with full precision; the position is never put in the URL. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  const radius = Number.isFinite(toNumber(body.radius))
    ? toNumber(body.radius)
    : NEARBY_RADIUS_METERS;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required." },
      { status: 400 },
    );
  }

  try {
    const organizations = await loadEmergencyOrganizations(
      { lat, lng },
      radius,
    );
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[api/emergency]", error);
    return NextResponse.json(
      { error: "Failed to load emergency help nearby." },
      { status: 502 },
    );
  }
}
