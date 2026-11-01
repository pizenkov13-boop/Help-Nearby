import "server-only";

/** Identifiable bot User-Agent (standard crawler format) for HDX, GDHO and ReliefWeb. */
export const OCHA_USER_AGENT =
  "Mozilla/5.0 (compatible; HelpNearbyBot/1.0; +https://www.help-nearby.org; hello@help-nearby.org)";

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
