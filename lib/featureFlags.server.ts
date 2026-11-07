import "server-only";

import { isCountryBlocked, parseBlockedCountries } from "@/lib/regionBlock";
import { siteConfig } from "@/lib/siteConfig";
import { isSunnyRegionCountry } from "@/lib/sunnyRegions";

/**
 * Runtime switches set only in the hosting dashboard (never in the repository):
 * - FORMS_DISABLED_COUNTRIES: comma-separated two-letter codes, empty by default. Visitors whose
 *   country (Vercel's x-vercel-ip-country header) is listed cannot use the review and submit forms.
 *   Main site only: a copy ignores it.
 *   The same list also switches the AI assistant off for those visitors (see chatDisabledForRequest).
 * - CHAT_ENABLED: the AI assistant is on unless the value is "false".
 */

/** True when this request comes from a country whose forms are switched off. */
export function formsDisabledForHeaders(headers: Headers): boolean {
  if (siteConfig.isCopy) return false;
  const disabled = parseBlockedCountries(process.env.FORMS_DISABLED_COUNTRIES);
  return isCountryBlocked(headers.get("x-vercel-ip-country"), disabled);
}

/**
 * True when the visitor's country (the same Vercel header as above) is in SUNNY_COUNTRY_CODES, so the
 * "Auto" theme starts light. Only this yes/no reaches the page; the country itself is not stored or logged.
 */
export function sunnyCountryForHeaders(headers: Headers): boolean {
  return isSunnyRegionCountry(null, headers.get("x-vercel-ip-country"));
}

export function formsDisabledForRequest(request: Request): boolean {
  return formsDisabledForHeaders(request.headers);
}

/**
 * True when the AI assistant must not answer this request: the visitor's country is in
 * FORMS_DISABLED_COUNTRIES (main site only). The chat route checks this before anything else, so
 * nothing is sent to the AI service, counted or logged for these visitors.
 */
export function chatDisabledForRequest(request: Request): boolean {
  return formsDisabledForRequest(request);
}

export function isChatEnabledOnServer(): boolean {
  return process.env.CHAT_ENABLED?.trim().toLowerCase() !== "false";
}
