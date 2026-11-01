import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { LIVE_WINDOW_DAYS, listLiveDeployments } from "@/lib/deployments.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live copies: deployments seen within the last 7 days. */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const deployments = await listLiveDeployments();
  if (!deployments) {
    return NextResponse.json({ error: "Failed to load deployments." }, { status: 503 });
  }
  return NextResponse.json({
    windowDays: LIVE_WINDOW_DAYS,
    count: deployments.length,
    deployments,
  });
}
