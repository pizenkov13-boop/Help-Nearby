import { NextResponse } from "next/server";
import { chatDisabledForRequest, formsDisabledForRequest, isChatEnabledOnServer } from "@/lib/featureFlags.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What this visitor may use: { chat, forms }. Both are booleans, nothing else is revealed (not the
 * list of countries, not the visitor's country). Never cached, because the answer depends on the request.
 */
export async function GET(request: Request) {
  return NextResponse.json(
    { chat: isChatEnabledOnServer() && !chatDisabledForRequest(request), forms: !formsDisabledForRequest(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
