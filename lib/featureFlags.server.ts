import "server-only";

import { isCountryBlocked, parseBlockedCountries } from "@/lib/regionBlock";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Runtime switches set only in the hosting dashboard (never in the repository):
 * - FORMS_DISABLED_COUNTRIES: comma-separated two-letter codes, empty by default. Visitors whose
 *   country (Vercel's x-vercel-ip-country header) is listed cannot use the review and submit forms.
 *   Main site only: a copy ignores it.
 * - CHAT_ENABLED: the AI assistant is on unless the value is "false".
 */

/** True when this request comes from a country whose forms are switched off. */
export function formsDisabledForRequest(request: Request): boolean {
  if (siteConfig.isCopy) return false;
  const disabled = parseBlockedCountries(process.env.FORMS_DISABLED_COUNTRIES);
  return isCountryBlocked(request.headers.get("x-vercel-ip-country"), disabled);
}

export function isChatEnabledOnServer(): boolean {
  return process.env.CHAT_ENABLED?.trim().toLowerCase() !== "false";
}
