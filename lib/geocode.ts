/** Forward geocode a free-text address via OpenStreetMap Nominatim. */
export async function forwardGeocodeQuery(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query.trim());
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

/** Forward geocode an address to coordinates via OpenStreetMap Nominatim. */
export async function forwardGeocode(
  address: string,
  city: string,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city, country].filter(Boolean).join(", ");
  return forwardGeocodeQuery(query);
}

export interface ReverseGeocodeResult {
  country: string;
  countryCode: string | null;
}

/** Reverse geocode coordinates to country name and ISO code via Nominatim. */
export async function reverseGeocodeCountry(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
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
      address?: { country?: string; country_code?: string };
    };

    const country = data.address?.country;
    if (!country) return null;

    return {
      country,
      countryCode: data.address?.country_code?.toUpperCase() ?? null,
    };
  } catch {
    return null;
  }
}
