import { NextResponse } from "next/server";
import { fetchOrganizations } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim() || undefined;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius"));

  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const location = hasLocation ? { lat, lng } : null;

  const options: {
    country?: string;
    radiusMeters?: number;
  } = {};

  if (country) options.country = country;
  if (Number.isFinite(radius)) options.radiusMeters = radius;

  try {
    const organizations = await fetchOrganizations(location, options);
    return NextResponse.json(organizations);
  } catch (error) {
    console.warn("[api/organizations]", error);
    return NextResponse.json([]);
  }
}
