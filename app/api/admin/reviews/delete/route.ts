import { NextResponse } from "next/server";
import { deleteReviewById } from "@/lib/admin";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: number };
    const id = Number(body.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Valid id is required." }, { status: 400 });
    }

    const result = await deleteReviewById(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/reviews/delete]", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
