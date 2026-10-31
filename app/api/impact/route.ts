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

/** The number is the same for every visitor: the CDN may keep it for a minute. */
const COUNT_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  ensureEnvLoaded();
  const result = await getTodayImpactCount();
  if (!result.ok) {
    // An explicit error, never a made-up {"count":0}.
    return NextResponse.json(
      { count: null, error: true, reason: result.reason, ...(result.detail ? { detail: result.detail } : {}) },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { count: result.count },
    { headers: { "Cache-Control": COUNT_CACHE_CONTROL } },
  );
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

    const stored = await trackImpactClick(orgId, action);
    if (!stored) {
      return NextResponse.json({ ok: false, error: true }, { status: 503 });
    }
    const result = await getTodayImpactCount();

    return NextResponse.json({ ok: true, count: result.ok ? result.count : null });
  } catch (error) {
    console.error("[api/impact POST]", error);
    return NextResponse.json({ ok: false, error: true }, { status: 400 });
  }
}
