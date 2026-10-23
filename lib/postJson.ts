/** POST a JSON body (client and server). Used wherever the user's position is sent to our API. */
export function postJson(
  url: string,
  body: unknown,
  init?: { signal?: AbortSignal },
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: init?.signal,
  });
}
