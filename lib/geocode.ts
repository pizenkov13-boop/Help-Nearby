/** Forward geocode an address to coordinates via OpenStreetMap Nominatim. */
export async function forwardGeocode(
  address: string,
  city: string,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city, country].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}

/** Reverse geocode coordinates to a country name via OpenStreetMap Nominatim. */
export async function reverseGeocodeCountry(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "HelpNearby/1.0 (help-nearby.app)" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      address?: { country?: string };
    };

    return data.address?.country ?? null;
  } catch {
    return null;
  }
}
