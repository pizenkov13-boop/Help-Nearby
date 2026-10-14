import { NextResponse } from "next/server";
import { aiCompleteDetailed } from "@/lib/aiProvider.server";
import { consumeChatQuota, getClientIp } from "@/lib/chatRateLimit.server";
import { getAiConfig } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diagnostics for the AI provider. Never returns the API key. */
export async function GET(request: Request) {
  const { apiKey, baseUrl, model } = getAiConfig();
  const body = {
    hasKey: Boolean(apiKey),
    model,
    baseUrl,
    reachable: false,
    status: 0,
  };

  if (!apiKey) return NextResponse.json(body);

  // Each call spends a provider request, so share the per-IP chat quota.
  if (!consumeChatQuota(getClientIp(request))) {
    return NextResponse.json({ ...body, status: 429 }, { status: 429 });
  }

  const result = await aiCompleteDetailed(
    [{ role: "user", content: "ping" }],
    { maxTokens: 5, temperature: 0, timeoutMs: 10_000 },
  );

  return NextResponse.json({
    ...body,
    reachable: result.ok,
    status: result.ok ? 200 : result.status,
  });
}
