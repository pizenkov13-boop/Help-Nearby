/** Canonical site origin, shared by the sitemap, robots, canonical URLs and JSON-LD. */
import { siteConfig } from "@/lib/siteConfig";

export const SITE_URL = siteConfig.url;

/** Static, indexable pages (the admin and API routes are intentionally absent). */
export const STATIC_SITEMAP_PATHS = [
  "/",
  "/about",
  "/why-it-matters",
  "/reviews",
  "/recent",
  "/submit",
  "/privacy",
] as const;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
