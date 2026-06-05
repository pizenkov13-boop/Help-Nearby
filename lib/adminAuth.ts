import { cookies } from "next/headers";
import { ensureEnvLoaded } from "@/lib/env.server";

export const ADMIN_COOKIE_NAME = "hn_admin";

export function getAdminPassword(): string | undefined {
  ensureEnvLoaded();
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password && password.length > 0 ? password : undefined;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i]! ^ bufB[i]!;
  }
  return diff === 0;
}

async function sessionToken(): Promise<string> {
  const password = getAdminPassword() ?? "";
  const data = new TextEncoder().encode(`help-nearby-admin:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return timingSafeEqualStrings(input, expected);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!getAdminPassword()) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token === (await sessionToken());
}

export async function adminSessionCookieValue(): Promise<string> {
  return sessionToken();
}
