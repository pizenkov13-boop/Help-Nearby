import "server-only";

export const CHAT_RATE_LIMIT = 20;
export const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** In-memory sliding window per IP (per server instance). Returns true when allowed. */
export function consumeChatQuota(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter(
    (t) => now - t < CHAT_RATE_WINDOW_MS,
  );
  if (recent.length >= CHAT_RATE_LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= CHAT_RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}
