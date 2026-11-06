import { NextResponse } from "next/server";
import { readJsonBody, toTrimmedString } from "@/lib/apiBody.server";
import { LANGUAGES } from "@/lib/i18n/translations";
import { nominatimSearch, nominatimSearchPlaces } from "@/lib/nominatim.server";
import { withTimeout } from "@/lib/ttlCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEOCODE_TIMEOUT_MS = 4000;

/**
 * Body: { q, limit?, lang? }. The typed place or address travels in the POST body, never in the
 * URL, so it does not end up in access logs, history or Referer headers. GET is not served (405).
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const q = toTrimmedString(body.q);

  if (!q) {
    return NextResponse.json(
      { error: "Field q is required." },
      { status: 400 },
    );
  }

  // Place search / autocomplete: "limit" returns { results: [{ name, lat, lng, ... }] }.
  if (body.limit !== undefined && body.limit !== null) {
    const limit = Math.min(Math.max(Math.trunc(Number(body.limit)) || 1, 1), 5);
    const requested = typeof body.lang === "string" ? body.lang : "en";
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
