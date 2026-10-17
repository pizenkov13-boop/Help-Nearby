import type { MetadataRoute } from "next";
import { countSitemapOrganizations, fetchSitemapOrganizations } from "@/lib/data";
import {
  buildSitemapChunk,
  SITEMAP_ORGS_PER_FILE,
  sitemapChunkCount,
} from "@/lib/sitemapEntries";

// Read the catalog on request, not at build time (the build may have no database access).
export const dynamic = "force-dynamic";

/**
 * Sitemap files for catalogs larger than one file (45,000 organizations each):
 * /sitemap/0.xml, /sitemap/1.xml, ... The index and the single-file case are served by
 * app/sitemap.xml/route.ts, which is what robots.txt points at.
 */
export async function generateSitemaps() {
  const total = await countSitemapOrganizations();
  return Array.from({ length: sitemapChunkCount(total) }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const orgs = await fetchSitemapOrganizations(
    id * SITEMAP_ORGS_PER_FILE,
    SITEMAP_ORGS_PER_FILE,
  );
  return buildSitemapChunk(id, orgs);
}
