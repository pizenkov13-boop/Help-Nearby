import { countSitemapOrganizations, fetchSitemapOrganizations } from "@/lib/data";
import {
  buildSitemapChunk,
  renderSitemapIndex,
  renderUrlset,
  SITEMAP_ORGS_PER_FILE,
  sitemapChunkCount,
} from "@/lib/sitemapEntries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

/**
 * /sitemap.xml — the single sitemap while the catalog fits in one file, otherwise a sitemap
 * index that points at /sitemap/0.xml, /sitemap/1.xml, ... (see app/sitemap.ts).
 */
export async function GET() {
  const total = await countSitemapOrganizations();
  const chunks = sitemapChunkCount(total);

  if (chunks > 1) {
    return new Response(renderSitemapIndex(chunks), { headers: HEADERS });
  }

  const orgs = await fetchSitemapOrganizations(0, SITEMAP_ORGS_PER_FILE);
  return new Response(renderUrlset(buildSitemapChunk(0, orgs)), { headers: HEADERS });
}
