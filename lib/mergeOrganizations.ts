import { distanceMiles } from "@/lib/geo";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { isApproximateLocation } from "@/lib/organizationCoordinates";
import type { Organization } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;

/** Letters and digits of any script (Latin, Cyrillic, CJK, Arabic, ...), lowercased. */
function normalizeOrgName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** The same name this close (about 500 m) is one organization; a chain's other branches are farther away. */
const SAME_NAME_RADIUS_MILES = 0.3;

function isDuplicateOrganization(
  existing: Organization,
  candidate: Organization,
): boolean {
  const existingName = normalizeOrgName(existing.name);
  const sameName = existingName !== "" && existingName === normalizeOrgName(candidate.name);

  const hasCoords =
    Number.isFinite(existing.lat) &&
    Number.isFinite(existing.lng) &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng) &&
    !(existing.lat === 0 && existing.lng === 0) &&
    !(candidate.lat === 0 && candidate.lng === 0);

  // Without coordinates (country-level directory entries) the name is all there is to compare.
  if (!hasCoords) return sameName;

  const miles = distanceMiles(existing.lat, existing.lng, candidate.lat, candidate.lng);
  if (miles < DUPLICATE_RADIUS_MILES) return true;
  return sameName && miles < SAME_NAME_RADIUS_MILES;
}

/** Merge sources; earlier batches win duplicates (name or proximity). */
export function mergeOrganizations(
  catalog: Organization[],
  externalVerified: Organization[],
): Organization[] {
  const merged = [...catalog];

  for (const org of externalVerified) {
    const isDuplicate = merged.some((existing) =>
      isDuplicateOrganization(existing, org),
    );
    if (!isDuplicate) {
      merged.push(org);
    }
  }

  return sortOrganizationsForList(merged);
}

/**
 * List order: entries with exact coordinates first, nearest first within each group
 *   0. verified catalog entries,
 *   1. unverified OSM entries,
 * then, at the very end, entries without exact coordinates (no coordinates, or approximate
 * country-level OCHA entries). No distance is shown for those.
 */
function listRank(org: Organization): number {
  if (isApproximateLocation(org) || !hasValidMapCoordinates(org)) return 2;
  return org.verified ? 0 : 1;
}

export function sortOrganizationsForList(orgs: Organization[]): Organization[] {
  return [...orgs].sort((a, b) => {
    const rank = listRank(a) - listRank(b);
    if (rank !== 0) return rank;
    return parseDistanceValue(a.distance) - parseDistanceValue(b.distance);
  });
}

function parseDistanceValue(distance: string): number {
  if (!distance) return 9999;
  const match = distance.match(/^([\d.]+)\s*(mi|ft)?/i);
  if (!match) return 9999;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "ft" ? value / 5280 : value;
}
