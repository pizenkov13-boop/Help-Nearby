import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, adminCookieOptions, getAdminSession } from "@/lib/adminAuth";
import { revokeSession } from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  // The session id is invalidated on the server, so a copy of the cookie stops working too.
  const session = await getAdminSession();
  if (session) revokeSession(session);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", adminCookieOptions(0));
  return NextResponse.json({ ok: true });
}
