import { NextResponse } from "next/server";
import { readJsonBody, toNumber, toTrimmedString } from "@/lib/apiBody.server";
import { fetchOrganizations } from "@/lib/data";
import type { Organization } from "@/lib/types";
import { createTtlCache, searchCacheKey, withTimeout } from "@/lib/ttlCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_TIMEOUT_MS = 4000;
const catalogCache = createTtlCache<Organization[]>();

/** Body: { country? } or { lat, lng, radius }. The position is never put in the URL. */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const country = toTrimmedString(body.country);
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  const radius = toNumber(body.radius);

  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const location = hasLocation ? { lat, lng } : null;

  const options: {
    country?: string;
    radiusMeters?: number;
  } = {};

  if (country) options.country = country;
  if (Number.isFinite(radius)) options.radiusMeters = radius;

  // Distances depend on the exact position, so only cache by ~1 km buckets of country/location/radius.
  const key = location
    ? searchCacheKey("catalog", lat, lng, Number.isFinite(radius) ? radius : 0, "all", country)
    : `catalog:${(country ?? "").toLowerCase()}`;

  const cached = catalogCache.get(key);
  if (cached) return NextResponse.json(cached);

  try {
    const organizations = await withTimeout(
      fetchOrganizations(location, options),
      SUPABASE_TIMEOUT_MS,
      null,
    );
    if (organizations === null) {
      console.warn("[api/organizations] Supabase timed out");
      return NextResponse.json([]);
    }
    if (organizations.length > 0) catalogCache.set(key, organizations);
    return NextResponse.json(organizations);
  } catch (error) {
    console.warn("[api/organizations]", error);
    return NextResponse.json([]);
  }
}
