import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { reverseGeocodeCountry } from "@/lib/geocode";
import { loadEmergencyOrganizations } from "@/lib/loadEmergencyOrganizations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? NEARBY_RADIUS_METERS);
  let country = searchParams.get("country")?.trim() ?? "";
  let countryCode = searchParams.get("countryCode")?.trim() || null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required." },
      { status: 400 },
    );
  }

  if (!country) {
    const geo = await reverseGeocodeCountry(lat, lng);
    country = geo?.country ?? "";
    countryCode = geo?.countryCode ?? countryCode;
  }

  try {
    const organizations = await loadEmergencyOrganizations(
      { lat, lng },
      radius,
      country || undefined,
      countryCode,
    );
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[api/emergency]", error);
    return NextResponse.json(
      { error: "Failed to load emergency help nearby." },
      { status: 502 },
    );
  }
}
