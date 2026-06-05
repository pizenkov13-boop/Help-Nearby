import { NextResponse } from "next/server";
import { submitOrganization } from "@/lib/submit";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!isCategory(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const result = await submitOrganization({
      name: String(body.name ?? ""),
      category: body.category,
      country: String(body.country ?? ""),
      city: String(body.city ?? ""),
      address: String(body.address ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
      email: body.email ? String(body.email) : undefined,
      website: body.website ? String(body.website) : undefined,
      hours: body.hours ? String(body.hours) : undefined,
      description: body.description ? String(body.description) : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, slug: result.slug });
  } catch (error) {
    console.error("[api/submit]", error);
    return NextResponse.json(
      { error: "Failed to submit organization." },
      { status: 500 },
    );
  }
}
