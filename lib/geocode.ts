import { postJson } from "@/lib/postJson";

export interface ReverseGeocodeResult {
  country: string;
  countryCode: string | null;
  /** Short "district, city" label for the position; null when Nominatim has none. */
  place?: string | null;
}

/** Forward geocode a free-text address via the server-side Nominatim proxy. */
export async function forwardGeocodeQuery(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!query.trim()) return null;

  try {
    const params = new URLSearchParams({ q: query.trim() });
    const response = await fetch(`/api/geocode?${params}`);

    if (!response.ok) return null;

    const data = (await response.json()) as { lat?: number; lng?: number };
    if (
      typeof data.lat !== "number" ||
      typeof data.lng !== "number" ||
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng)
    ) {
      return null;
    }

    return { lat: data.lat, lng: data.lng };
  } catch {
    return null;
  }
}

/** Forward geocode an address to coordinates via the server-side Nominatim proxy. */
export async function forwardGeocode(
  address: string,
  city: string,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city, country].filter(Boolean).join(", ");
  return forwardGeocodeQuery(query);
}

/** Reverse geocode coordinates to country via the server-side Nominatim proxy. */
export async function reverseGeocodeCountry(
  lat: number,
  lng: number,
  language?: string,
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await postJson("/api/geocode/reverse", {
      lat,
      lng,
      ...(language ? { lang: language } : {}),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ReverseGeocodeResult;
    if (!data.country) return null;

    return data;
  } catch {
    return null;
  }
}
