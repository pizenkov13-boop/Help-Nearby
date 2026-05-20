import { NextResponse } from "next/server";
import { getAdminPassword, isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({
    authenticated,
    configured: Boolean(getAdminPassword()),
    canVerify: Boolean(getSupabaseAdmin()),
  });
}
