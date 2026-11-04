import { resolveCountryCode } from "@/lib/countryFlags";

/** RELIEFWEB_SKIP_COUNTRIES: comma-separated two-letter codes, empty by default. Read on every call. */
export function reliefWebSkipCountries(value = process.env.RELIEFWEB_SKIP_COUNTRIES): ReadonlySet<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter((code) => /^[A-Z]{2}$/.test(code)),
  );
}

/** True for countries where ReliefWeb is not queried (set through RELIEFWEB_SKIP_COUNTRIES). */
export function skipsReliefWeb(country: string, countryCode?: string | null): boolean {
  const skip = reliefWebSkipCountries();
  if (skip.size === 0) return false;
  const given = countryCode?.trim().toUpperCase();
  if (given && skip.has(given)) return true;
  const resolved = resolveCountryCode(country);
  return Boolean(resolved && skip.has(resolved.toUpperCase()));
}
