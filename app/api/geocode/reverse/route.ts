import { NextResponse } from "next/server";
import { readJsonBody, toNumber } from "@/lib/apiBody.server";
import { nominatimReverse } from "@/lib/nominatim.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { lat, lng, lang? } (never in the URL). Returns the country and a short place label. */
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
    const language = typeof body.lang === "string" ? body.lang : undefined;
    const result = await nominatimReverse(lat, lng, language);

    if (!result) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/geocode/reverse]", error);
    return NextResponse.json({ error: "Reverse geocoding failed." }, { status: 502 });
  }
}
