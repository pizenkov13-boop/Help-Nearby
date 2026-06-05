import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchVerifiedNearbyOrganizations } from "@/lib/verifiedNearby.server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? NEARBY_RADIUS_METERS);
  const country = searchParams.get("country")?.trim();
  const countryCode = searchParams.get("countryCode")?.trim() || null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json([]);
  }

  if (!country) {
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
