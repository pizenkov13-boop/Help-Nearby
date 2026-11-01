import rules from "@/config/sourceRules.json";
import { resolveCountryCode } from "@/lib/countryFlags";

const RELIEFWEB_SKIP = new Set(rules.reliefwebSkipCountryCodes.map((code) => code.toUpperCase()));

/** True for countries where ReliefWeb is not queried (configured in config/sourceRules.json). */
export function skipsReliefWeb(country: string, countryCode?: string | null): boolean {
  const given = countryCode?.trim().toUpperCase();
  if (given && RELIEFWEB_SKIP.has(given)) return true;
  const resolved = resolveCountryCode(country);
  return Boolean(resolved && RELIEFWEB_SKIP.has(resolved.toUpperCase()));
}
