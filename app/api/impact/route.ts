import { NextResponse } from "next/server";
import { ensureEnvLoaded } from "@/lib/env.server";
import {
  getTodayImpactCount,
  trackImpactClick,
  type ImpactAction,
} from "@/lib/impact.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isImpactAction(value: unknown): value is ImpactAction {
  return value === "call" || value === "directions";
}

export async function GET() {
  ensureEnvLoaded();
  try {
    const count = await getTodayImpactCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[api/impact GET]", error);
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const orgId = String(body.orgId ?? "").trim();
    const action = body.action;

    if (!orgId || !isImpactAction(action)) {
      return NextResponse.json(
        { error: "orgId and action (call|directions) are required." },
        { status: 400 },
      );
    }

    await trackImpactClick(orgId, action);
    const count = await getTodayImpactCount();

    return NextResponse.json({ ok: true, count });
  } catch (error) {
    console.error("[api/impact POST]", error);
    return NextResponse.json({ ok: true, count: 0 });
  }
}
