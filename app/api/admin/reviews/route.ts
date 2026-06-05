import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { fetchPendingReviews } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const reviews = await fetchPendingReviews();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[api/admin/reviews GET]", error);
    return NextResponse.json(
      { error: "Failed to load pending reviews." },
      { status: 500 },
    );
  }
}
