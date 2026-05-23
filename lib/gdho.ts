import "server-only";

import { slugify } from "@/lib/orgUtils";
import type { Category, Organization } from "@/lib/types";

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

function mapGdhoTypeToCategory(type: string, sector: string): Category {
  const combined = `${type} ${sector}`.toLowerCase();
  if (combined.includes("food") || combined.includes("nutrition")) return "food";
  if (combined.includes("shelter")) return "shelter";
  if (combined.includes("health") || combined.includes("medical")) return "medical";
  if (combined.includes("water") || combined.includes("sanitation")) return "medical";
  if (combined.includes("refugee") || combined.includes("coordination")) {
    return "volunteer";
  }
  if (type.toLowerCase().includes("un")) return "medical";
  return "volunteer";
}

function buildGdhoSearchUrl(country: string): string {
  const params = new URLSearchParams();
  params.append("country_of_operation[0]", country);
  params.set("format", "csv");
  return `${GDHO_SEARCH_BASE}?${params.toString()}`;
}

/**
 * Fetch humanitarian organizations operating in a country from GDHO (CSV export).
 */
export async function fetchGdhoOrganizationsForCountry(
  country: string,
): Promise<Organization[]> {
  const url = buildGdhoSearchUrl(country);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/csv",
        "User-Agent": "HelpNearby/1.0 (help-nearby.app)",
      },
      signal: AbortSignal.timeout(GDHO_TIMEOUT_MS),
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      console.warn(`[gdho] HTTP ${response.status} for ${country}`);
      return [];
    }

    const text = await response.text();
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

    if (nameIdx < 0) {
      console.warn("[gdho] CSV missing Name column");
      return [];
    }

    const organizations: Organization[] = [];

    for (let i = 1; i < dataLines.length; i++) {
      const row = parseCsvRow(dataLines[i]!);
      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const type = typeIdx >= 0 ? (row[typeIdx] ?? "") : "";
      const sector = sectorIdx >= 0 ? (row[sectorIdx] ?? "") : "";
      const hq = hqIdx >= 0 ? (row[hqIdx] ?? "").trim() : "";
      const website = websiteIdx >= 0 ? (row[websiteIdx] ?? "").trim() : "";
      const rawId = idIdx >= 0 ? (row[idIdx] ?? String(i)) : String(i);
      const category = mapGdhoTypeToCategory(type, sector);

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
    return organizations;
  } catch (error) {
    console.error("[gdho] fetch failed:", error);
    return [];
  }
}
