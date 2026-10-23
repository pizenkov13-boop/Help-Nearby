import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  adminLoginLimiter,
  createAdminSession,
  getAdminPassword,
  getAdminSessionSecret,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { getClientIp } from "@/lib/chatRateLimit.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A wrong password is answered slowly, which makes guessing even less practical. */
const FAILURE_DELAY_MS = 400;

export async function POST(request: Request) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 503 },
    );
  }
  if (!getAdminSessionSecret()) {
    return NextResponse.json(
      { error: "ADMIN_SESSION_SECRET (at least 32 characters) is not configured on the server." },
      { status: 503 },
    );
  }

  // The client key is only used in memory for the limiter; it is never logged or stored.
  const clientKey = getClientIp(request);
  const gate = adminLoginLimiter.check(clientKey);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds) } },
    );
  }

  try {
    const body = (await request.json()) as { password?: string };
    const password = String(body.password ?? "");

    if (!verifyAdminPassword(password)) {
      adminLoginLimiter.recordFailure(clientKey);
      await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const session = await createAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Login failed." }, { status: 500 });
    }

    adminLoginLimiter.reset(clientKey);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, session.token, adminCookieOptions(session.maxAge));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/login]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
