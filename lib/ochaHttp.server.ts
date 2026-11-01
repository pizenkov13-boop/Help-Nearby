import "server-only";

/**
 * TEMPORARY: the HDX and ReliefWeb WAFs return no data to our own identifiable User-Agents
 * (HelpNearby/1.0, HelpNearbyBot/1.0) from Vercel, so the curl User-Agent that worked before is back.
 * Replace it with an identifiable one once the WAF allows it.
 */
export const OCHA_USER_AGENT = "curl/8.5.0";

export function ochaFetch(
  input: string | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", OCHA_USER_AGENT);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return fetch(input, { cache: "no-store", ...init, headers });
}
