/**
 * Admin sessions: a random session id, an expiry time and an HMAC signature, in one cookie value.
 *   token = base64url(JSON{ v, sid, iat, exp }) + "." + base64url(HMAC-SHA256(key, payload))
 * The key is ADMIN_SESSION_SECRET combined with the admin password, so changing either one
 * invalidates every session. Pure functions (no Next.js imports) so they can be unit-tested.
 */

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const MIN_SESSION_SECRET_LENGTH = 32;

export interface SessionKeyMaterial {
  secret: string;
  password: string;
}

export interface SessionClaims {
  sid: string;
  /** Issued at / expires at, epoch seconds. */
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(material: SessionKeyMaterial): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`${material.secret}\u0000${material.password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function isUsableSecret(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SESSION_SECRET_LENGTH;
}

function randomSessionId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function createSessionToken(
  material: SessionKeyMaterial,
  nowMs: number = Date.now(),
  ttlSeconds: number = ADMIN_SESSION_TTL_SECONDS,
): Promise<{ token: string; claims: SessionClaims }> {
  const iat = Math.floor(nowMs / 1000);
  const claims: SessionClaims = { sid: randomSessionId(), iat, exp: iat + ttlSeconds };
  const payload = toBase64Url(encoder.encode(JSON.stringify({ v: 1, ...claims })));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(material), encoder.encode(payload));
  return { token: `${payload}.${toBase64Url(new Uint8Array(signature))}`, claims };
}

/** The claims of a correctly signed, unexpired token, or null. The signature check is constant-time. */
export async function verifySessionToken(
  token: string | undefined,
  material: SessionKeyMaterial,
  nowMs: number = Date.now(),
): Promise<SessionClaims | null> {
  if (!token || token.length > 512) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts as [string, string];
  const signatureBytes = fromBase64Url(signature);
  const payloadBytes = fromBase64Url(payload);
  if (!signatureBytes || !payloadBytes) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(material),
    signatureBytes as BufferSource,
    encoder.encode(payload),
  );
  if (!valid) return null;

  try {
    const claims = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionClaims> & { v?: number };
    if (
      claims.v !== 1 ||
      typeof claims.sid !== "string" ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }
    if (claims.exp <= Math.floor(nowMs / 1000)) return null;
    return { sid: claims.sid, iat: claims.iat, exp: claims.exp };
  } catch {
    return null;
  }
}

/**
 * Sessions ended by logout. Kept in memory of the server instance until they would expire anyway:
 * enough for one instance, not shared between serverless instances (see the note in the docs/PR).
 * Rotating ADMIN_SESSION_SECRET ends every session everywhere.
 */
const revoked = new Map<string, number>();

export function revokeSession(claims: SessionClaims): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [sid, exp] of revoked) if (exp <= now) revoked.delete(sid);
  revoked.set(claims.sid, claims.exp);
}

export function isSessionRevoked(sid: string): boolean {
  return revoked.has(sid);
}

export function clearRevokedSessionsForTests(): void {
  revoked.clear();
}

/** Failed-login limiter per client key (in memory, never logged): 5 failures per 15 minutes. */
export class LoginRateLimiter {
  private failures = new Map<string, number[]>();

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000,
  ) {}

  private recent(key: string, now: number): number[] {
    const list = (this.failures.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length > 0) this.failures.set(key, list);
    else this.failures.delete(key);
    return list;
  }

  /** allowed=false means: too many failures, retry after `retryAfterSeconds`. */
  check(key: string, now: number = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const list = this.recent(key, now);
    if (list.length < this.maxFailures) return { allowed: true, retryAfterSeconds: 0 };
    const oldest = list[0]!;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)),
    };
  }

  recordFailure(key: string, now: number = Date.now()): void {
    const list = this.recent(key, now);
    list.push(now);
    this.failures.set(key, list);
    if (this.failures.size > 5000) {
      for (const k of this.failures.keys()) this.recent(k, now);
    }
  }

  reset(key: string): void {
    this.failures.delete(key);
  }
}
