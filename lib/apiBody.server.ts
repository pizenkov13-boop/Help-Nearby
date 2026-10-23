import "server-only";

/**
 * Request bodies for the routes that receive the user's position. Coordinates travel in a JSON
 * POST body, never in the URL, so they do not end up in access logs, history or Referer headers.
 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** A finite number from a JSON value, or NaN. Missing or null is NaN (never 0). */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

export function toTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
