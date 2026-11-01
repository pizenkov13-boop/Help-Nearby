export const DETECTED_COUNTRY_CACHE_KEY = "help-nearby-detected-country";
/** Fired on window when the country of the search place becomes known (the distance unit follows it). */
export const DETECTED_COUNTRY_EVENT = "hn:country-detected";

export interface DetectedCountry {
  country: string;
  countryCode: string | null;
}

export function cacheDetectedCountry(
  country: string,
  countryCode: string | null,
): void {
  if (typeof sessionStorage === "undefined") return;

  sessionStorage.setItem(
    DETECTED_COUNTRY_CACHE_KEY,
    JSON.stringify({ country, countryCode } satisfies DetectedCountry),
  );
  window.dispatchEvent(new Event(DETECTED_COUNTRY_EVENT));
}

export function readCachedDetectedCountry(): DetectedCountry | null {
  if (typeof sessionStorage === "undefined") return null;

  const raw = sessionStorage.getItem(DETECTED_COUNTRY_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DetectedCountry;
    if (typeof parsed.country !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
