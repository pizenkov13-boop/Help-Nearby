import "server-only";

/** Honest, identifiable User-Agent for UN OCHA APIs (HDX, ReliefWeb). */
export const OCHA_USER_AGENT =
  "HelpNearby/1.0 (+https://www.help-nearby.org; hello@help-nearby.org)";

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
