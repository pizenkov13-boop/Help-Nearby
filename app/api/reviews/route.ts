import { NextResponse } from "next/server";
import { fetchReviews, submitReview } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await fetchReviews();
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
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.review);
  } catch (error) {
    console.error("[api/reviews POST]", error);
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 },
    );
  }
}
