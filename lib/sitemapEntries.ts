import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL, STATIC_SITEMAP_PATHS } from "@/lib/seo";

/** The protocol allows 50,000 URLs per file; stay well below it (chunk 0 also holds the static pages). */
export const SITEMAP_ORGS_PER_FILE = 45_000;

/** Slugs of the Playwright-only fixture organizations (E2E_FIXTURE_ORGS) must never be listed. */
const FIXTURE_SLUG_PREFIX = "e2e-";

export interface SitemapOrg {
  slug: string;
  /** updated_at when the table has it, otherwise created_at. */
  lastModified: string | null;
}

export function sitemapChunkCount(totalOrgs: number): number {
  return Math.max(1, Math.ceil(totalOrgs / SITEMAP_ORGS_PER_FILE));
}

function toDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Entries of one sitemap file. `orgs` are the organizations belonging to that chunk. */
export function buildSitemapChunk(
  chunkIndex: number,
  orgs: SitemapOrg[],
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  if (chunkIndex === 0) {
    for (const path of STATIC_SITEMAP_PATHS) {
      entries.push({
        url: absoluteUrl(path),
        changeFrequency: path === "/" || path === "/recent" ? "daily" : "monthly",
        priority: path === "/" ? 1 : 0.6,
      });
    }
  }

  for (const org of orgs) {
    if (!org.slug || org.slug.startsWith(FIXTURE_SLUG_PREFIX)) continue;
    entries.push({
      url: absoluteUrl(`/org/${encodeURIComponent(org.slug)}`),
      lastModified: toDate(org.lastModified),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function renderUrlset(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lastmod =
        entry.lastModified instanceof Date
          ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>`
          : "";
      const changefreq = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "";
      const priority = entry.priority != null ? `<priority>${entry.priority}</priority>` : "";
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

/** Index pointing at /sitemap/0.xml, /sitemap/1.xml, ... (served only when there is more than one file). */
export function renderSitemapIndex(chunks: number): string {
  const items = Array.from(
    { length: chunks },
    (_, i) => `<sitemap><loc>${SITE_URL}/sitemap/${i}.xml</loc></sitemap>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>\n`;
}
