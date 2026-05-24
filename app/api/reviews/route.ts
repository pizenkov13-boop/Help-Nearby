import { NextResponse } from "next/server";
import { fetchApprovedReviews, submitReview } from "@/lib/reviews";
import { getSupabaseConfigStatus } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await fetchApprovedReviews();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[api/reviews GET]", error);
    return NextResponse.json(
      { error: "Failed to load reviews." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const config = getSupabaseConfigStatus();
  if (!config.configured) {
    console.error("[api/reviews POST] Supabase not configured", config);
    return NextResponse.json(
      { error: "Reviews are temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rating = Number(body.rating);

    const result = await submitReview({
      name: String(body.name ?? ""),
      country: String(body.country ?? ""),
      message: String(body.message ?? ""),
      rating,
    });

    if (!result.ok) {
      console.error("[api/reviews POST] submit failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.review);
  } catch (error) {
    console.error("[api/reviews POST] unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 },
    );
  }
}
