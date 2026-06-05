import { NextResponse } from "next/server";
import { snapToNearestWalkingRoad } from "@/lib/osrmSnap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required." },
      { status: 400 },
    );
  }

  try {
    const snapped = await snapToNearestWalkingRoad(lng, lat);
    return NextResponse.json({ lat: snapped.lat, lng: snapped.lng });
  } catch (error) {
    console.error("[api/nearest]", error);
    return NextResponse.json({ lat, lng });
  }
}
