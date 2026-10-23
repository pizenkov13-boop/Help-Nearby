import { NextResponse } from "next/server";
import { readJsonBody, toNumber } from "@/lib/apiBody.server";
import { snapToNearestWalkingRoad } from "@/lib/osrmSnap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { lat, lng }. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required." },
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
