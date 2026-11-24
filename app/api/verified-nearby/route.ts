import { NextResponse } from "next/server";
import { readJsonBody, toNumber, toTrimmedString } from "@/lib/apiBody.server";
import { createTtlCache, withTimeout } from "@/lib/ttlCache";
import { fetchVerifiedDirectory } from "@/lib/verifiedNearby.server";
import type { Organization } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTORY_TIMEOUT_MS = 6000;
const directoryCache = createTtlCache<Organization[]>();

/** Body: { country, countryCode?, stage?: "directory", lat?, lng?, radius? }. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  const country = toTrimmedString(body.country);
  const countryCode = toTrimmedString(body.countryCode) ?? null;
  const stage = toTrimmedString(body.stage);

  if (!country) {
    return NextResponse.json([]);
  }

  // Fast path: country-level entries without coordinates (no geocoding), cached 5 min.
  if (stage === "directory") {
    const key = `${country.toLowerCase()}:${countryCode ?? ""}`;
    const cached = directoryCache.get(key);
    if (cached) return NextResponse.json(cached);

    try {
      const organizations = await withTimeout(
        fetchVerifiedDirectory(country, countryCode),
        DIRECTORY_TIMEOUT_MS,
        null,
      );
      if (organizations === null) {
        return NextResponse.json({ error: "timeout" }, { status: 504 });
      }
      if (organizations.length > 0) directoryCache.set(key, organizations);
      return NextResponse.json(organizations);
    } catch (error) {
      console.error("[api/verified-nearby] directory", error);
      return NextResponse.json({ error: "failed" }, { status: 502 });
    }
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json([]);
  }

  // These directories describe organizations at country level, not confirmed local offices.
  // Geocoding their names cannot establish that they are actually nearby.
  return NextResponse.json([]);
}
