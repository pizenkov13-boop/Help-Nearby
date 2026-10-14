import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { createTtlCache, withTimeout } from "@/lib/ttlCache";
import {
  fetchVerifiedDirectory,
  fetchVerifiedNearbyOrganizations,
} from "@/lib/verifiedNearby.server";
import type { Organization } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTORY_TIMEOUT_MS = 6000;
const directoryCache = createTtlCache<Organization[]>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? NEARBY_RADIUS_METERS);
  const country = searchParams.get("country")?.trim();
  const countryCode = searchParams.get("countryCode")?.trim() || null;
  const stage = searchParams.get("stage");

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

  try {
    const organizations = await fetchVerifiedNearbyOrganizations(
      { lat, lng },
      radius,
      country,
      countryCode,
    );
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[api/verified-nearby]", error);
    return NextResponse.json([]);
  }
}
