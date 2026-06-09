import "server-only";

import { ensureEnvLoaded } from "@/lib/env.server";
import { ochaFetch } from "@/lib/ochaHttp.server";
import { slugify } from "@/lib/orgUtils";
import type { Category, Organization } from "@/lib/types";

const RELIEFWEB_API = "https://api.reliefweb.int/v2/";
const RELIEFWEB_TIMEOUT_MS = 30_000;
const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const DEFAULT_APPNAME = "help-nearby-sources-a4p8n1QSR";

interface ReliefWebCountry {
  id?: number;
  name?: string;
  iso3?: string;
  shortname?: string;
  location?: { lat?: number; lon?: number };
}

interface ReliefWebSourceFields {
  name?: string | string[];
  shortname?: string | string[];
  longname?: string | string[];
  homepage?: string | string[];
  description?: string | string[];
  country?: ReliefWebCountry[];
  type?: { name?: string } | Array<{ id?: number; name?: string }>;
}

interface ReliefWebSourceItem {
  id: string;
  fields?: ReliefWebSourceFields;
}

interface ReliefWebListResponse {
  data?: ReliefWebSourceItem[];
  totalCount?: number;
}

interface ReliefWebListBody {
  limit: number;
  offset: number;
  fields: { include: string[] };
  filter: {
    operator: string;
    conditions: Array<{ field: string; value: string }>;
  };
}

function getReliefWebAppName(): string {
  ensureEnvLoaded();
  const fromEnv = process.env.RELIEFWEB_APPNAME?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_APPNAME;
}

function fieldText(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  return value?.[0]?.trim() ?? "";
}

function typeNameFromFields(
  type: ReliefWebSourceFields["type"],
): string {
  if (!type) return "";
  if (Array.isArray(type)) return type[0]?.name?.trim() ?? "";
  return type.name?.trim() ?? "";
}

function inferCategory(description: string, name: string, typeName: string): Category {
  const text = `${name} ${description} ${typeName}`.toLowerCase();
  if (/\b(food|nutrition|wfp|hunger|agriculture)\b/.test(text)) return "food";
  if (/\b(shelter|housing|displacement|camp)\b/.test(text)) return "shelter";
  if (/\b(medical|health|clinic|hospital|pharma|wash)\b/.test(text)) return "medical";
  if (/\b(clothing|apparel)\b/.test(text)) return "clothing";
  return "volunteer";
}

function mapReliefWebSource(item: ReliefWebSourceItem, country: string): Organization | null {
  const fields = item.fields;
  if (!fields) return null;

  const name =
    fieldText(fields.longname) ||
    fieldText(fields.name) ||
    fieldText(fields.shortname);
  if (!name) return null;

  const typeName = typeNameFromFields(fields.type);
  const description =
    fieldText(fields.description) ||
    `Humanitarian organization listed on ReliefWeb${typeName ? ` (${typeName})` : ""}.`;
  const category = inferCategory(description, name, typeName);
  const homepage = fieldText(fields.homepage);
  const rwId = item.id.replace(/\D/g, "") || item.id;
  const countryLat = fields.country?.[0]?.location?.lat;
  const countryLng = fields.country?.[0]?.location?.lon;
  const lat = Number.isFinite(countryLat) ? (countryLat as number) : 0;
  const lng = Number.isFinite(countryLng) ? (countryLng as number) : 0;

  return {
    id: `rw-${rwId}`,
    slug: slugify(`rw-${name}`),
    name,
    category,
    categories: [category],
    country,
    city: "",
    lat,
    lng,
    distance: "",
    rating: 0,
    address: "",
    phone: "",
    email: "",
    website: homepage,
    description,
    hours: {},
    hoursRaw: "",
    openNow: false,
    verified: true,
  };
}

function buildCountryFilter(
  country: string,
  countryCode?: string | null,
): ReliefWebListBody["filter"] {
  const iso3 = countryCode?.trim().toUpperCase();
  if (iso3 && iso3.length === 3) {
    return {
      operator: "AND",
      conditions: [{ field: "country.iso3", value: iso3 }],
    };
  }

  return {
    operator: "AND",
    conditions: [{ field: "country", value: country.trim() }],
  };
}

async function reliefWebListSources(
  country: string,
  countryCode?: string | null,
): Promise<ReliefWebSourceItem[]> {
  const appname = getReliefWebAppName();
  const url = `${RELIEFWEB_API}sources?appname=${encodeURIComponent(appname)}`;
  const filter = buildCountryFilter(country, countryCode);
  const collected: ReliefWebSourceItem[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const body: ReliefWebListBody = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      filter,
      fields: {
        include: [
          "name",
          "shortname",
          "longname",
          "homepage",
          "description",
          "country",
          "type.name",
        ],
      },
    };

    try {
      const response = await ochaFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(RELIEFWEB_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.warn(`[reliefweb] sources HTTP ${response.status}`);
        break;
      }

      const payload = (await response.json()) as ReliefWebListResponse;
      const batch = payload.data ?? [];
      collected.push(...batch);

      const total = payload.totalCount ?? collected.length;
      if (batch.length === 0 || collected.length >= total) break;
    } catch (error) {
      console.error("[reliefweb] sources fetch failed:", error);
      break;
    }
  }

  return collected;
}

/**
 * Humanitarian organizations (sources) active in a country via ReliefWeb API v2.
 */
export async function fetchReliefWebOrganizationsForCountry(
  country: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const items = await reliefWebListSources(country, countryCode);
  const organizations: Organization[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const org = mapReliefWebSource(item, country);
    if (!org) continue;
    const key = org.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    organizations.push(org);
  }

  console.log(
    `[reliefweb] ${organizations.length} organization(s) for ${country}`,
  );
  return organizations;
}
