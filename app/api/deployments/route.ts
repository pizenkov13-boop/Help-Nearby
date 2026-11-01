import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/chatRateLimit.server";
import {
  consumePingQuota,
  MAX_PING_BODY_BYTES,
  parseDeploymentPing,
  recordDeployment,
} from "@/lib/deployments.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Anonymous deployment ping: {domain, version, timestamp}. Nothing else is read or stored. */
export async function POST(request: Request) {
  if (!consumePingQuota(getClientIp(request))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_PING_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const raw = await request.text();
  if (raw.length > MAX_PING_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ping = parseDeploymentPing(body);
  if (!ping) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const stored = await recordDeployment(ping);
  return stored
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false }, { status: 503 });
}
