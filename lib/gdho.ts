import "server-only";

import { slugify } from "@/lib/orgUtils";
import { createTtlCache } from "@/lib/ttlCache";
import type { Category, Organization } from "@/lib/types";

const gdhoCache = createTtlCache<Organization[]>(60 * 60 * 1000);
const csvCache = createTtlCache<string>(60 * 60 * 1000, 2);

const GDHO_SEARCH_BASE = "https://humanitarianoutcomes.org/gdho/search/results";
const GDHO_TIMEOUT_MS = 45_000;

/** Minimal RFC4180-style CSV row parser (handles quoted fields). */
function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

/** Keyword allowlist; null (not shown) when the type and sector name none of the five categories. */
function mapGdhoTypeToCategory(type: string, sector: string): Category | null {
  const combined = `${type} ${sector}`.toLowerCase();
  if (combined.includes("food") || combined.includes("nutrition")) return "food";
  if (combined.includes("shelter")) return "shelter";
  if (combined.includes("health") || combined.includes("medical")) return "medical";
  if (combined.includes("water") || combined.includes("sanitation")) return "medical";
  if (combined.includes("refugee") || combined.includes("coordination")) {
    return "volunteer";
  }
  return null;
}

/** Our country names (Nominatim / ISO) → the column titles GDHO uses where they differ. */
const GDHO_COLUMN_ALIASES: Record<string, string> = {
  "democratic republic of the congo": "DR Congo",
  "dr congo": "DR Congo",
  "republic of the congo": "Congo",
  syria: "Syrian Arab Republic",
  libya: "Libyan Arab Jamahiriya",
  russia: "Russian Federation",
  iran: "Iran, Islamic Republic of",
  "south korea": "Korea, Republic of",
  "north korea": "Korea, Democratic People's Republic of",
  laos: "Lao People's Democratic Republic",
  moldova: "Moldova, Republic of",
  "north macedonia": "Macedonia, the Former Yugoslav Republic of",
  palestine: "Occupied Palestinian Territories",
  "palestinian territories": "Occupied Palestinian Territories",
  "state of palestine": "Occupied Palestinian Territories",
  "côte d'ivoire": "Cote D'Ivoire",
  "ivory coast": "Cote D'Ivoire",
  "cabo verde": "Cape Verde",
  czechia: "Czech Republic",
  türkiye: "Turkey",
  brunei: "Brunei Darussalam",
  "east timor": "Timor-Leste",
  micronesia: "Micronesia, Federated States of",
  "united states of america": "United States",
  usa: "United States",
  uk: "United Kingdom",
  vatican: "Holy See (Vatican City State)",
  eswatini: "Eswatini",
  swaziland: "Eswatini",
};

function findCountryColumn(header: string[], country: string): number {
  const wanted = country.trim().toLowerCase();
  const target = (GDHO_COLUMN_ALIASES[wanted] ?? country).trim().toLowerCase();
  const exact = header.findIndex((h) => h.trim().toLowerCase() === target);
  if (exact >= 0) return exact;
  // "Moldova, Republic of" style titles.
  return header.findIndex((h) => h.trim().toLowerCase().startsWith(`${target},`));
}

/** The whole GDHO table in one download (the site ignores country filters and has one column per country). */
async function loadGdhoCsv(): Promise<string | null> {
  const cached = csvCache.get("all");
  if (cached) return cached;

  const response = await fetch(`${GDHO_SEARCH_BASE}?format=csv`, {
    headers: {
      Accept: "text/csv",
      "User-Agent": "HelpNearby/1.0 (help-nearby.app)",
    },
    signal: AbortSignal.timeout(GDHO_TIMEOUT_MS),
    // Not the Next.js data cache: it would keep a WAF challenge page (HTTP 200, no CSV) for a day.
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn(`[gdho] HTTP ${response.status}`);
    return null;
  }

  const text = await response.text();
  if (!text.includes("Countries of Operation")) {
    console.warn(
      `[gdho] not a CSV answer (HTTP ${response.status}, ${response.headers.get("content-type") ?? "no content-type"}, ${text.length} bytes)`,
    );
    return null;
  }
  csvCache.set("all", text);
  return text;
}

/**
 * Organizations that operate in a country, from the GDHO CSV export (closed organizations are skipped).
 */
export async function fetchGdhoOrganizationsForCountry(
  country: string,
): Promise<Organization[]> {
  const cacheKey = country.trim().toLowerCase();
  const cached = gdhoCache.get(cacheKey);
  if (cached) return cached;

  try {
    const text = await loadGdhoCsv();
    if (!text) return [];

    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const dataLines = lines.filter(
      (line) => !line.startsWith('"Please read') && line.includes(","),
    );
    if (dataLines.length < 2) return [];

    const header = parseCsvRow(dataLines[0]!);
    const nameIdx = header.findIndex((h) => h === "Name");
    const typeIdx = header.findIndex((h) => h === "Type");
    const websiteIdx = header.findIndex((h) => h === "Website");
    const hqIdx = header.findIndex((h) => h === "HQ location");
    const sectorIdx = header.findIndex((h) => h === "Sector");
    const idIdx = header.findIndex((h) => h === "Id");
    const closedIdx = header.findIndex((h) => h === "Year closed");
    const countryIdx = findCountryColumn(header, country);

    if (nameIdx < 0) {
      console.warn("[gdho] CSV missing Name column");
      return [];
    }
    if (countryIdx < 0) {
      console.warn(`[gdho] no column for ${country}`);
      return [];
    }

    const organizations: Organization[] = [];

    for (let i = 1; i < dataLines.length; i++) {
      const row = parseCsvRow(dataLines[i]!);
      if ((row[countryIdx] ?? "").trim() === "") continue;
      if (closedIdx >= 0 && (row[closedIdx] ?? "").trim() !== "") continue;
      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const type = typeIdx >= 0 ? (row[typeIdx] ?? "") : "";
      const sector = sectorIdx >= 0 ? (row[sectorIdx] ?? "") : "";
      const hq = hqIdx >= 0 ? (row[hqIdx] ?? "").trim() : "";
      const website = websiteIdx >= 0 ? (row[websiteIdx] ?? "").trim() : "";
      const rawId = idIdx >= 0 ? (row[idIdx] ?? String(i)) : String(i);
      const category = mapGdhoTypeToCategory(type, sector);
      if (!category) continue;

      const descriptionParts = [
        type ? `Type: ${type}` : "",
        sector ? `Focus: ${sector}` : "",
        `Countries of operation include ${country}`,
      ].filter(Boolean);

      organizations.push({
        id: `gdho-${rawId}`,
        slug: slugify(`gdho-${name}`),
        name,
        category,
        categories: [category],
        country,
        city: hq,
        lat: 0,
        lng: 0,
        distance: "",
        rating: 0,
        address: hq ? `HQ: ${hq}` : "",
        phone: "",
        email: "",
        website,
        description: descriptionParts.join(" · "),
        hours: {},
        hoursRaw: "",
        openNow: false,
        verified: true,
      });
    }

    console.log(`[gdho] ${organizations.length} organization(s) for ${country}`);
    // Only a real answer is remembered (for an hour); an empty one is retried on the next request.
    if (organizations.length > 0) gdhoCache.set(cacheKey, organizations);
    return organizations;
  } catch (error) {
    console.error("[gdho] fetch failed:", error);
    return [];
  }
}
