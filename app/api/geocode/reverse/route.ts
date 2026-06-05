import { NextResponse } from "next/server";
import { nominatimReverse } from "@/lib/nominatim.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Query parameters lat and lon are required." },
      { status: 400 },
    );
  }

  try {
    const result = await nominatimReverse(lat, lon);

    if (!result) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/geocode/reverse]", error);
    return NextResponse.json({ error: "Reverse geocoding failed." }, { status: 502 });
  }
}
