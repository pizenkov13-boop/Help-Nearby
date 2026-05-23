import { NextResponse } from "next/server";
import { nominatimSearch } from "@/lib/nominatim.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter q is required." },
      { status: 400 },
    );
  }

  try {
    const coords = await nominatimSearch(q);

    if (!coords) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    return NextResponse.json(coords);
  } catch (error) {
    console.error("[api/geocode]", error);
    return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
  }
}
