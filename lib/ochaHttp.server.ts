import "server-only";

/**
 * UN OCHA APIs (HDX, ReliefWeb) sit behind a WAF that blocks Node's default
 * fetch fingerprint. A standard library User-Agent is required for server-side calls.
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
