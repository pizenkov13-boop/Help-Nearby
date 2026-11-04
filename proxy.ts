import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isCountryBlocked,
  isRegionExemptPath,
  parseBlockedCountries,
  unavailablePageHtml,
} from "@/lib/regionBlock";
import { siteConfig } from "@/lib/siteConfig";

/**
 * Regional access limit (BLOCKED_COUNTRIES, set only in the hosting dashboard). It applies to the
 * main site only: a copy ignores the variable. The country comes from Vercel's x-vercel-ip-country
 * header; a missing header or a code outside the list passes.
 */
export function proxy(request: NextRequest) {
  if (siteConfig.isCopy) return NextResponse.next();

  const blocked = parseBlockedCountries(process.env.BLOCKED_COUNTRIES);
  if (blocked.size === 0) return NextResponse.next();
  if (isRegionExemptPath(request.nextUrl.pathname)) return NextResponse.next();
  if (!isCountryBlocked(request.headers.get("x-vercel-ip-country"), blocked)) return NextResponse.next();

  return new NextResponse(unavailablePageHtml(request.headers.get("accept-language")), {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      vary: "Accept-Language",
    },
  });
}
