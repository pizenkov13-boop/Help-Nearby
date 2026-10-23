import { cookies } from "next/headers";
import { ensureEnvLoaded } from "@/lib/env.server";
import {
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  isSessionRevoked,
  isUsableSecret,
  LoginRateLimiter,
  verifySessionToken,
  type SessionClaims,
  type SessionKeyMaterial,
} from "@/lib/adminSession";

export const ADMIN_COOKIE_NAME = "hn_admin";

export function getAdminPassword(): string | undefined {
  ensureEnvLoaded();
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password && password.length > 0 ? password : undefined;
}

/** ADMIN_SESSION_SECRET (at least 32 characters) signs the session cookie. */
export function getAdminSessionSecret(): string | undefined {
  ensureEnvLoaded();
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return isUsableSecret(secret) ? secret : undefined;
}

/** Admin access needs both the password and the session secret; otherwise it is switched off. */
export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword() && getAdminSessionSecret());
}

function keyMaterial(): SessionKeyMaterial | null {
  const password = getAdminPassword();
  const secret = getAdminSessionSecret();
  return password && secret ? { password, secret } : null;
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

export function verifyAdminPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return timingSafeEqualStrings(input, expected);
}

/** Claims of the current request's session cookie when it is valid, unexpired and not logged out. */
export async function getAdminSession(): Promise<SessionClaims | null> {
  const material = keyMaterial();
  if (!material) return null;

  const cookieStore = await cookies();
  const claims = await verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value, material);
  if (!claims || isSessionRevoked(claims.sid)) return null;
  return claims;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/** A fresh signed session for a successful login. */
export async function createAdminSession(): Promise<{ token: string; maxAge: number } | null> {
  const material = keyMaterial();
  if (!material) return null;
  const { token } = await createSessionToken(material);
  return { token, maxAge: ADMIN_SESSION_TTL_SECONDS };
}

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge,
    path: "/",
  };
}

/** Failed-login limiter shared by the login route of this server instance. */
export const adminLoginLimiter = new LoginRateLimiter();
