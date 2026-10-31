import { createHash } from "node:crypto";
import { test, expect } from "./fixtures";
import type { APIRequestContext, PlaywrightWorkerArgs } from "@playwright/test";

type Playwright = PlaywrightWorkerArgs["playwright"];
import {
  ADMIN_SESSION_TTL_SECONDS,
  clearRevokedSessionsForTests,
  createSessionToken,
  isSessionRevoked,
  isUsableSecret,
  LoginRateLimiter,
  revokeSession,
  verifySessionToken,
} from "@/lib/adminSession";

const material = {
  secret: "unit-test-secret-0123456789-abcdefghijklmn",
  password: "unit-test-password",
};
const NOW = Date.UTC(2026, 9, 23, 12, 0, 0);

test.describe("Admin session token (unit)", () => {
  test("a fresh token verifies and carries a random id and an 8 hour expiry", async () => {
    const { token, claims } = await createSessionToken(material, NOW);
    const verified = await verifySessionToken(token, material, NOW + 1000);

    expect(verified).toEqual(claims);
    expect(claims.exp - claims.iat).toBe(ADMIN_SESSION_TTL_SECONDS);
    expect(ADMIN_SESSION_TTL_SECONDS).toBe(8 * 60 * 60);

    const other = await createSessionToken(material, NOW);
    expect(other.claims.sid).not.toBe(claims.sid);
    expect(other.token).not.toBe(token);
  });

  test("it expires", async () => {
    const { token } = await createSessionToken(material, NOW);
    const lastSecond = NOW + (ADMIN_SESSION_TTL_SECONDS - 1) * 1000;
    expect(await verifySessionToken(token, material, lastSecond)).not.toBeNull();
    expect(await verifySessionToken(token, material, NOW + ADMIN_SESSION_TTL_SECONDS * 1000)).toBeNull();
    expect(await verifySessionToken(token, material, NOW + 24 * 3600 * 1000)).toBeNull();
  });

  test("a tampered payload or signature is rejected", async () => {
    const { token } = await createSessionToken(material, NOW);
    const [payload, signature] = token.split(".") as [string, string];

    // extend the expiry inside the payload while keeping the old signature
    const forged = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, number>;
    forged.exp += 10 * 24 * 3600;
    const forgedPayload = Buffer.from(JSON.stringify(forged)).toString("base64url");
    expect(await verifySessionToken(`${forgedPayload}.${signature}`, material, NOW)).toBeNull();

    const flipped = signature.slice(0, -2) + (signature.endsWith("AA") ? "BB" : "AA");
    expect(await verifySessionToken(`${payload}.${flipped}`, material, NOW)).toBeNull();
  });

  test("a different secret or a changed password invalidates the session", async () => {
    const { token } = await createSessionToken(material, NOW);
    expect(await verifySessionToken(token, { ...material, secret: material.secret + "x" }, NOW)).toBeNull();
    expect(await verifySessionToken(token, { ...material, password: "new-password" }, NOW)).toBeNull();
  });

  test("garbage is rejected without throwing", async () => {
    for (const value of [undefined, "", "abc", "a.b", "a.b.c", ".", "%%%.%%%", "x".repeat(600)]) {
      expect(await verifySessionToken(value, material, NOW), String(value)).toBeNull();
    }
  });

  test("the old fixed SHA-256 token is not a session", async () => {
    const legacy = createHash("sha256").update(`help-nearby-admin:${material.password}`).digest("hex");
    expect(await verifySessionToken(legacy, material, NOW)).toBeNull();
  });

  test("logout revokes the session id", async () => {
    clearRevokedSessionsForTests();
    const { claims } = await createSessionToken(material, Date.now());
    expect(isSessionRevoked(claims.sid)).toBe(false);
    revokeSession(claims);
    expect(isSessionRevoked(claims.sid)).toBe(true);
  });

  test("a usable secret has at least 32 characters", () => {
    expect(isUsableSecret(undefined)).toBe(false);
    expect(isUsableSecret("short")).toBe(false);
    expect(isUsableSecret("x".repeat(31))).toBe(false);
    expect(isUsableSecret("x".repeat(32))).toBe(true);
  });
});

test.describe("Login rate limiter (unit)", () => {
  test("blocks after 5 failures in the window and reports when to retry", () => {
    const limiter = new LoginRateLimiter(5, 15 * 60 * 1000);
    for (let i = 0; i < 5; i += 1) {
      expect(limiter.check("a", NOW + i).allowed).toBe(true);
      limiter.recordFailure("a", NOW + i);
    }
    const blocked = limiter.check("a", NOW + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(14 * 60);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });

  test("other clients are not affected and the window slides", () => {
    const limiter = new LoginRateLimiter(5, 15 * 60 * 1000);
    for (let i = 0; i < 5; i += 1) limiter.recordFailure("a", NOW);
    expect(limiter.check("b", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW + 15 * 60 * 1000 + 1).allowed).toBe(true);
  });

  test("a successful login resets the counter", () => {
    const limiter = new LoginRateLimiter(5, 15 * 60 * 1000);
    for (let i = 0; i < 4; i += 1) limiter.recordFailure("a", NOW);
    limiter.reset("a");
    for (let i = 0; i < 4; i += 1) limiter.recordFailure("a", NOW);
    expect(limiter.check("a", NOW).allowed).toBe(true);
  });
});

// The test web server runs with test-only ADMIN_PASSWORD / ADMIN_SESSION_SECRET (playwright.config.ts).
const PASSWORD = "e2e-admin-password";

async function login(request: APIRequestContext, ip: string, password = PASSWORD) {
  return request.post("/api/admin/login", {
    headers: { "x-forwarded-for": ip },
    data: { password },
  });
}

function tokenFrom(response: { headers(): Record<string, string> }): string | null {
  const setCookie = response.headers()["set-cookie"] ?? "";
  return setCookie.match(/hn_admin=([^;]+)/)?.[1] ?? null;
}

/** A context without any stored cookies (the shared one remembers Set-Cookie from earlier logins). */
async function cleanContext(playwright: Playwright, baseURL: string | undefined) {
  return playwright.request.newContext({ baseURL });
}

async function sessionWith(playwright: Playwright, baseURL: string | undefined, token: string | null) {
  const clean = await cleanContext(playwright, baseURL);
  try {
    const res = await clean.get("/api/admin/session", {
      headers: token ? { cookie: `hn_admin=${token}` } : {},
    });
    return (await res.json()) as { authenticated: boolean; configured: boolean };
  } finally {
    await clean.dispose();
  }
}

test.describe("Admin login (HTTP)", () => {
  test("a wrong password is refused and sets no cookie", async ({ request, playwright, baseURL }) => {
    const res = await login(request, "203.0.113.10", "wrong");
    expect(res.status()).toBe(401);
    expect(tokenFrom(res)).toBeNull();
    expect((await sessionWith(playwright, baseURL, null)).configured).toBe(true);
  });

  test("a good login sets a signed, expiring, HttpOnly, SameSite=Strict cookie", async ({ request, playwright, baseURL }) => {
    const res = await login(request, "203.0.113.11");
    expect(res.status()).toBe(200);

    const setCookie = res.headers()["set-cookie"] ?? "";
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    expect(setCookie).toMatch(/Max-Age=28800/);

    const token = tokenFrom(res)!;
    expect(token).toMatch(/^[\w-]+\.[\w-]+$/); // payload.signature, not a fixed hash
    expect(token).not.toMatch(/^[0-9a-f]{64}$/);
    expect((await sessionWith(playwright, baseURL, token)).authenticated).toBe(true);

    const clean = await cleanContext(playwright, baseURL);
    const protectedRoute = await clean.get("/api/admin/reviews", { headers: { cookie: `hn_admin=${token}` } });
    expect(protectedRoute.status()).not.toBe(401);
    const anonymous = await clean.get("/api/admin/reviews");
    expect(anonymous.status()).toBe(401);
    await clean.dispose();
  });

  test("two logins get different tokens", async ({ request }) => {
    const a = tokenFrom(await login(request, "203.0.113.12"));
    const b = tokenFrom(await login(request, "203.0.113.12"));
    expect(a).not.toBeNull();
    expect(a).not.toBe(b);
  });

  test("a forged, tampered or old-style cookie is not a session", async ({ request, playwright, baseURL }) => {
    const token = tokenFrom(await login(request, "203.0.113.13"))!;
    const [payload, signature] = token.split(".") as [string, string];

    const forgedPayload = Buffer.from(
      JSON.stringify({ v: 1, sid: "x", iat: 1, exp: 4102444800 }),
    ).toString("base64url");
    const legacy = createHash("sha256").update(`help-nearby-admin:${PASSWORD}`).digest("hex");

    for (const bad of [`${forgedPayload}.${signature}`, `${payload}.${signature.slice(1)}A`, legacy, "garbage"]) {
      expect((await sessionWith(playwright, baseURL, bad)).authenticated, bad).toBe(false);
    }
  });

  test("logout ends the session: a copy of the old cookie stops working", async ({ request, playwright, baseURL }) => {
    const token = tokenFrom(await login(request, "203.0.113.14"))!;
    expect((await sessionWith(playwright, baseURL, token)).authenticated).toBe(true);

    const out = await request.post("/api/admin/logout", { headers: { cookie: `hn_admin=${token}` } });
    expect(out.status()).toBe(200);
    expect(out.headers()["set-cookie"] ?? "").toMatch(/hn_admin=;|Max-Age=0/i);

    expect((await sessionWith(playwright, baseURL, token)).authenticated).toBe(false);
  });

  test("5 wrong passwords block the client with 429 and Retry-After, even for the right password", async ({
    request,
  }) => {
    const ip = "203.0.113.20";
    for (let i = 0; i < 5; i += 1) {
      expect((await login(request, ip, `wrong-${i}`)).status()).toBe(401);
    }

    const blocked = await login(request, ip, "wrong-again");
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);

    const rightButBlocked = await login(request, ip);
    expect(rightButBlocked.status()).toBe(429);
    expect(tokenFrom(rightButBlocked)).toBeNull();

    // another client is unaffected
    expect((await login(request, "203.0.113.21")).status()).toBe(200);
  });
});
