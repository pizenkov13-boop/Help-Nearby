import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { fetchRecentOrganizations, RECENT_PAGE_SIZE } from "@/lib/data";
import type { Category } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim().slice(0, 100) || undefined;
  const categoryParam = searchParams.get("category")?.trim().toLowerCase();
  const category = CATEGORIES.includes(categoryParam as Category)
    ? (categoryParam as Category)
    : undefined;
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);

  const result = await fetchRecentOrganizations({
    offset: Number.isFinite(offset) ? offset : 0,
    limit: RECENT_PAGE_SIZE,
    country,
    category,
  });

  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
