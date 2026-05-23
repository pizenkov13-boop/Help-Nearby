import { distanceMiles } from "@/lib/geo";
import type { Organization } from "@/lib/types";

const DUPLICATE_RADIUS_MILES = 0.05;

/** Merge Supabase catalog and HDX/GDHO verified sources; catalog wins duplicates. */
export function mergeOrganizations(
  catalog: Organization[],
  externalVerified: Organization[],
): Organization[] {
  const merged = [...catalog];

  for (const org of externalVerified) {
    const isDuplicate = catalog.some(
      (v) =>
        distanceMiles(v.lat, v.lng, org.lat, org.lng) < DUPLICATE_RADIUS_MILES,
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
