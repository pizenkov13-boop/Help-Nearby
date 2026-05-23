import "server-only";

/** Nominatim search — server-side only (Nominatim usage policy). */
export async function nominatimSearch(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { lat: string; lon: string }[];
  const first = data[0];
  if (!first) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}
