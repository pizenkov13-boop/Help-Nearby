import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ chat: false, forms: false }, { headers: { "Cache-Control": "no-store" } });
}
