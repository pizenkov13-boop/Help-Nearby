import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchNearbyOrganizations } from "@/lib/overpass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("[api/nearby] Request:", request.url);

  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Number(searchParams.get("radius") ?? NEARBY_RADIUS_METERS);

    console.log("[api/nearby] Params:", { lat, lng, radius });

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn("[api/nearby] Invalid lat/lng — returning empty list");
      return NextResponse.json([]);
    }

    const organizations = await fetchNearbyOrganizations(lat, lng, radius);
    console.log(
      `[api/nearby] Success: ${organizations.length} organization(s)`,
    );
    return NextResponse.json(organizations);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[api/nearby] Error:", message);
    if (stack) console.error("[api/nearby] Stack:", stack);

    return NextResponse.json([]);
  }
}
