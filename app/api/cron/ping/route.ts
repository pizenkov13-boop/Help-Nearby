import { NextResponse } from "next/server";
import { sendDeploymentPing } from "@/lib/ping.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daily Vercel cron (see vercel.json). If CRON_SECRET is set, Vercel sends it as a Bearer token. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    request.headers.get("host") ||
    "";
  const result = await sendDeploymentPing(host);
  return NextResponse.json({ result });
}
