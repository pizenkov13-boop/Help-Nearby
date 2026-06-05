import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { fetchUnverifiedOrganizations } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const organizations = await fetchUnverifiedOrganizations();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("[api/admin/organizations]", error);
    return NextResponse.json(
      { error: "Failed to load organizations." },
      { status: 500 },
    );
  }
}
