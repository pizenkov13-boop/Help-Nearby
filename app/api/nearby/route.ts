import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchNearbyOrganizations } from "@/lib/overpass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? NEARBY_RADIUS_METERS);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required." },
      { status: 400 },
    );
  }

  try {
    const organizations = await fetchNearbyOrganizations(lat, lng, radius);
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[api/nearby]", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby organizations." },
      { status: 502 },
    );
  }
}
