"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { stripQueryAndHash } from "@/lib/analyticsUrl";

/** Page views only; the address is sent without any query string or hash. */
const beforeSend: BeforeSend = (event) => ({ ...event, url: stripQueryAndHash(event.url) });

/**
 * Vercel Web Analytics: cookieless, aggregated counts of visits, pages and countries.
 * The script is served from our own origin (/_vercel/insights/script.js). mode="production" keeps it
 * that way in development too (the default dev mode would load a debug script from an external host).
 */
export function VercelAnalytics() {
  return <Analytics mode="production" beforeSend={beforeSend} />;
}
