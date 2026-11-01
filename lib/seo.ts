/** Canonical site origin, shared by the sitemap, robots, canonical URLs and JSON-LD. */
import { siteConfig } from "@/lib/siteConfig";

export const SITE_URL = siteConfig.url;

/** Static, indexable pages (the admin and API routes are intentionally absent). */
const MAIN_SITEMAP_PATHS = [
  "/",
  "/about",
  "/why-it-matters",
  "/reviews",
  "/recent",
  "/submit",
  "/privacy",
] as const;

/** A copy has no history, reviews, submissions or recent-additions pages. */
const COPY_SITEMAP_PATHS = ["/", "/about", "/privacy"] as const;

export const STATIC_SITEMAP_PATHS: readonly string[] = siteConfig.isCopy
  ? COPY_SITEMAP_PATHS
  : MAIN_SITEMAP_PATHS;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
