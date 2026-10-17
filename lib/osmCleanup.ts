import { distanceMiles } from "@/lib/geo";
import type { Organization } from "@/lib/types";

/** Same-name records closer than this are treated as one place (a chain's other branches are far apart). */
export const DUPLICATE_RADIUS_METERS = 100;
/** Names shorter than this are junk. */
export const MIN_NAME_LENGTH = 4;
/** A name repeated this many times in one result set, with no contact data, is junk. */
export const REPEATED_NAME_LIMIT = 5;

const METERS_PER_MILE = 1609.34;
const LIFECYCLE_TAG = /^(disused|abandoned|was):/i;

export interface OsmCleanupStats {
  before: number;
  duplicates: number;
  junk: number;
  closed: number;
  after: number;
}

/** True when OSM marks the object as no longer in use (disused:*, abandoned:*, was:*). */
export function hasClosedLifecycleTag(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  return Object.keys(tags).some((key) => LIFECYCLE_TAG.test(key));
}

export function normalizeOsmName(name: string): string {
  return name.trim().toLowerCase();
}

const filled = (value: string | undefined) => Boolean(value?.trim());

/** Number of filled fields among phone, website, address and hours (more = richer record). */
export function osmRichness(org: Organization): number {
  return [org.phone, org.website, org.address, org.hoursRaw].filter(filled).length;
}

function metersBetween(a: Organization, b: Organization): number {
  return distanceMiles(a.lat, a.lng, b.lat, b.lng) * METERS_PER_MILE;
}

/**
 * Same normalized name within 100 m: keep the richest record (first one on a tie).
 * Order of the kept records is unchanged.
 */
export function dedupeOsmOrganizations(orgs: Organization[]): Organization[] {
  const byRichness = orgs
    .map((org, index) => ({ org, index }))
    .sort((a, b) => osmRichness(b.org) - osmRichness(a.org) || a.index - b.index);

  const keptByName = new Map<string, Organization[]>();
  const keptIndexes = new Set<number>();

  for (const { org, index } of byRichness) {
    const key = normalizeOsmName(org.name);
    const group = keptByName.get(key) ?? [];
    if (group.some((kept) => metersBetween(kept, org) < DUPLICATE_RADIUS_METERS)) continue;
    group.push(org);
    keptByName.set(key, group);
    keptIndexes.add(index);
  }

  return orgs.filter((_, index) => keptIndexes.has(index));
}

/**
 * Junk: a name under 4 characters, or a name repeated 5+ times in the result set
 * where the record has no phone, website or address.
 */
export function removeJunkOsmOrganizations(orgs: Organization[]): Organization[] {
  const counts = new Map<string, number>();
  for (const org of orgs) {
    const key = normalizeOsmName(org.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return orgs.filter((org) => {
    const key = normalizeOsmName(org.name);
    if (key.length < MIN_NAME_LENGTH) return false;
    const noContacts = !filled(org.phone) && !filled(org.website) && !filled(org.address);
    return !(noContacts && (counts.get(key) ?? 0) >= REPEATED_NAME_LIMIT);
  });
}

/** Duplicates first, then junk (counted on distinct places); closed objects are dropped earlier, per element. */
export function cleanOsmOrganizations(
  orgs: Organization[],
  closed = 0,
): { organizations: Organization[]; stats: OsmCleanupStats } {
  const deduped = dedupeOsmOrganizations(orgs);
  const organizations = removeJunkOsmOrganizations(deduped);
  return {
    organizations,
    stats: {
      before: orgs.length + closed,
      duplicates: orgs.length - deduped.length,
      junk: deduped.length - organizations.length,
      closed,
      after: organizations.length,
    },
  };
}
