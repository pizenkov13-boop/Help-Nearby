import "server-only";

import { slugify } from "@/lib/orgUtils";
import type { Category, Organization } from "@/lib/types";

const HDX_API = "https://data.humdata.org/api/3/action/";
const HDX_TIMEOUT_MS = 30_000;
const PACKAGE_PAGE_SIZE = 100;
const MAX_PACKAGE_PAGES = 15;

interface HdxGroup {
  name: string;
  title?: string;
}

interface HdxOrganization {
  id?: string;
  name: string;
  title?: string;
  display_name?: string;
  description?: string;
  org_url?: string;
}

interface HdxPackage {
  organization?: HdxOrganization;
}

interface HdxListResponse<T> {
  success: boolean;
  result?: T;
}

interface HdxSearchResult {
  count?: number;
  results?: HdxPackage[];
}

let groupListCache: HdxGroup[] | null = null;

async function hdxGet<T>(action: string, params: Record<string, string>): Promise<T | null> {
  const url = new URL(`${HDX_API}${action}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(HDX_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`[hdx] ${action} HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as HdxListResponse<T>;
    if (!data.success) return null;
    return data.result ?? null;
  } catch (error) {
    console.error(`[hdx] ${action} failed:`, error);
    return null;
  }
}

async function fetchHdxGroups(): Promise<HdxGroup[]> {
  if (groupListCache) return groupListCache;

  const groups = await hdxGet<HdxGroup[]>("group_list", {
    all_fields: "true",
  });
  groupListCache = groups ?? [];
  return groupListCache;
}

/** Resolve HDX location group slug (e.g. `ukr`) from geocoded country. */
export async function resolveHdxGroupName(
  country: string,
  countryCode?: string | null,
): Promise<string | null> {
  const groups = await fetchHdxGroups();
  const normalizedCountry = country.trim().toLowerCase();

  const byTitle = groups.find(
    (g) => g.title?.trim().toLowerCase() === normalizedCountry,
  );
  if (byTitle?.name) return byTitle.name;

  if (countryCode) {
    const code = countryCode.trim().toLowerCase();
    const byCode = groups.find((g) => g.name?.toLowerCase() === code);
    if (byCode?.name) return byCode.name;

    const byPrefix = groups.find((g) =>
      g.name?.toLowerCase().startsWith(code),
    );
    if (byPrefix?.name) return byPrefix.name;
  }

  return null;
}

function inferCategory(description: string, name: string): Category {
  const text = `${name} ${description}`.toLowerCase();
  if (/\b(food|nutrition|wfp|hunger)\b/.test(text)) return "food";
  if (/\b(shelter|housing|displacement)\b/.test(text)) return "shelter";
  if (/\b(medical|health|clinic|hospital|pharma)\b/.test(text)) return "medical";
  if (/\b(clothing|apparel)\b/.test(text)) return "clothing";
  return "volunteer";
}

function mapHdxOrg(
  org: HdxOrganization,
  country: string,
  listEntry?: HdxOrganization,
): Organization {
  const name = org.title ?? org.display_name ?? org.name;
  const description =
    org.description ?? listEntry?.description ?? "Humanitarian data provider on HDX (UN OCHA).";
  const category = inferCategory(description, name);
  const slug = slugify(`hdx-${org.name}`);

  return {
    id: `hdx-${org.name}`,
    slug,
    name,
    category,
    categories: [category],
    country,
    city: "",
    lat: 0,
    lng: 0,
    distance: "",
    rating: 0,
    address: "",
    phone: "",
    email: "",
    website: org.org_url ?? "",
    description,
    hours: {},
    hoursRaw: "",
    openNow: false,
    verified: true,
  };
}

/**
 * Organizations active in a country via HDX CKAN:
 * package_search (country group) + organization_list enrichment.
 */
export async function fetchHdxOrganizationsForCountry(
  country: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const groupName = await resolveHdxGroupName(country, countryCode);
  if (!groupName) {
    console.warn(`[hdx] No HDX group for country: ${country}`);
    return [];
  }

  const orgMap = new Map<string, HdxOrganization>();

  for (let page = 0; page < MAX_PACKAGE_PAGES; page++) {
    const start = String(page * PACKAGE_PAGE_SIZE);
    const search = await hdxGet<HdxSearchResult>("package_search", {
      fq: `groups:${groupName}`,
      rows: String(PACKAGE_PAGE_SIZE),
      start,
    });

    const results = search?.results ?? [];
    if (results.length === 0) break;

    for (const pkg of results) {
      const org = pkg.organization;
      if (!org?.name) continue;
      if (!orgMap.has(org.name)) {
        orgMap.set(org.name, org);
      }
    }

    const total = search?.count ?? 0;
    if ((page + 1) * PACKAGE_PAGE_SIZE >= total) break;
  }

  const listOrgs = await hdxGet<HdxOrganization[]>("organization_list", {
    all_fields: "true",
    limit: "1000",
  });

  const listByName = new Map<string, HdxOrganization>();
  for (const org of listOrgs ?? []) {
    if (org.name) listByName.set(org.name, org);
  }

  const organizations: Organization[] = [];
  for (const [name, pkgOrg] of orgMap) {
    const listEntry = listByName.get(name);
    if (listEntry && !pkgOrg.description && listEntry.description) {
      pkgOrg.description = listEntry.description;
    }
    if (listEntry?.org_url && !pkgOrg.org_url) {
      pkgOrg.org_url = listEntry.org_url;
    }
    organizations.push(mapHdxOrg(pkgOrg, country, listEntry));
  }

  console.log(
    `[hdx] ${organizations.length} organization(s) for ${country} (group ${groupName})`,
  );
  return organizations;
}
