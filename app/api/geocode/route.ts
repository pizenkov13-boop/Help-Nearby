import { NextResponse } from "next/server";
import { LANGUAGES } from "@/lib/i18n/translations";
import { nominatimSearch, nominatimSearchPlaces } from "@/lib/nominatim.server";
import { withTimeout } from "@/lib/ttlCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEOCODE_TIMEOUT_MS = 4000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter q is required." },
      { status: 400 },
    );
  }

  // Place search / autocomplete: ?limit=N returns { results: [{ name, lat, lng, ... }] }.
  const limitParam = searchParams.get("limit");
  if (limitParam !== null) {
    const limit = Math.min(Math.max(Number.parseInt(limitParam, 10) || 1, 1), 5);
    const requested = searchParams.get("lang") ?? "en";
    const language = LANGUAGES.some((l) => l.code === requested) ? requested : "en";

    try {
      const results = await withTimeout(
        nominatimSearchPlaces(q, limit, language, GEOCODE_TIMEOUT_MS),
        GEOCODE_TIMEOUT_MS + 500,
        null,
      );
      if (results === null) {
        return NextResponse.json({ error: "Geocoding timed out." }, { status: 504 });
      }
      return NextResponse.json({ results });
    } catch (error) {
      console.error("[api/geocode] places", error instanceof Error ? error.message : "failed");
      return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
    }
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
