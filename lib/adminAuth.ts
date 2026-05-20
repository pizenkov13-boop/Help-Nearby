import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ensureEnvLoaded } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "hn_admin";

export function getAdminPassword(): string | undefined {
  ensureEnvLoaded();
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password && password.length > 0 ? password : undefined;
}

function sessionToken(): string {
  const password = getAdminPassword() ?? "";
  return createHash("sha256")
    .update(`help-nearby-admin:${password}`)
    .digest("hex");
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!getAdminPassword()) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token === sessionToken();
}

export function adminSessionCookieValue(): string {
  return sessionToken();
}
