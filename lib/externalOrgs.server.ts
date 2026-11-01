import "server-only";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createTtlCache } from "@/lib/ttlCache";
import type { Category, Organization } from "@/lib/types";

export interface StoredCountryBatches {
  hdx: Organization[];
  gdho: Organization[];
  reliefweb: Organization[];
}

interface ExternalOrgRow {
  id: string;
  source: "hdx" | "gdho" | "reliefweb";
  country: string;
  name: string;
  slug: string;
  category: Category;
  description: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
}

const MAX_ROWS = 3000;
const cache = createTtlCache<StoredCountryBatches>(10 * 60 * 1000);

function toOrganization(row: ExternalOrgRow): Organization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categories: [row.category],
    country: row.country,
    city: row.city ?? "",
    // Country-level entries have no coordinates; they are geocoded later, as before.
    lat: 0,
    lng: 0,
    distance: "",
    rating: 0,
    address: row.address ?? "",
    phone: "",
    email: "",
    website: row.website ?? "",
    description: row.description ?? "",
    hours: {},
    hoursRaw: "",
    openNow: false,
    verified: true,
  };
}

/**
 * The daily copy of the HDX / GDHO / ReliefWeb catalogs for one country.
 * Returns null when there is no database, no table or no rows, so the caller falls back to the live sources.
 */
export async function readStoredCountryOrgs(
  country: string,
  countryCode?: string | null,
): Promise<StoredCountryBatches | null> {
  const client = getSupabaseAdmin();
  if (!client) return null;

  const code = countryCode?.trim().toUpperCase() || "";
  const key = country.trim().toLowerCase();
  const cacheKey = `${code}:${key}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  try {
    let query = client
      .from("external_orgs")
      .select("id, source, country, name, slug, category, description, city, address, website")
      .limit(MAX_ROWS);
    query = code.length === 2 ? query.eq("country_code", code) : query.eq("country_key", key);

    const { data, error } = await query;
    if (error) {
      console.warn(`[externalOrgs] read failed (${error.code ?? "error"}): ${error.message}`);
      return null;
    }
    const rows = (data ?? []) as ExternalOrgRow[];
    if (rows.length === 0) return null;

    const batches: StoredCountryBatches = { hdx: [], gdho: [], reliefweb: [] };
    for (const row of rows) batches[row.source]?.push(toOrganization(row));
    // Only a real answer is remembered; an empty table falls through to the live sources.
    cache.set(cacheKey, batches);
    return batches;
  } catch (error) {
    console.warn("[externalOrgs] read failed:", error instanceof Error ? error.message : error);
    return null;
  }
}
