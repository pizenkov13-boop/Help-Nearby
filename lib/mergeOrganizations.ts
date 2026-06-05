import { distanceMiles } from "@/lib/geo";
import type { Organization } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;

function normalizeOrgName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, " ")
    .trim();
}

function isDuplicateOrganization(
  existing: Organization,
  candidate: Organization,
): boolean {
  if (normalizeOrgName(existing.name) === normalizeOrgName(candidate.name)) {
    return true;
  }

  const hasCoords =
    Number.isFinite(existing.lat) &&
    Number.isFinite(existing.lng) &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng) &&
    !(existing.lat === 0 && existing.lng === 0) &&
    !(candidate.lat === 0 && candidate.lng === 0);

  if (!hasCoords) return false;

  return (
    distanceMiles(existing.lat, existing.lng, candidate.lat, candidate.lng) <
    DUPLICATE_RADIUS_MILES
  );
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

  return merged.sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    const distA = parseDistanceValue(a.distance);
    const distB = parseDistanceValue(b.distance);
    return distA - distB;
  });
}

function parseDistanceValue(distance: string): number {
  if (!distance) return 9999;
  const match = distance.match(/^([\d.]+)\s*(mi|ft)?/i);
  if (!match) return 9999;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "ft" ? value / 5280 : value;
}
