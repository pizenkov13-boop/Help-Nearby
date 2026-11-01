import { distanceMiles } from "@/lib/geo";
import type { Organization } from "@/lib/types";

/** Same-name records closer than this are treated as one place (a chain's other branches are far apart). */
export const DUPLICATE_RADIUS_METERS = 100;
/** Names shorter than this are junk (when the record has no contacts). */
export const MIN_NAME_LENGTH = 4;

const METERS_PER_MILE = 1609.34;
const LIFECYCLE_TAG = /^(disused|abandoned|was):/i;
/** Chinese, Japanese or Korean characters: a 2-character name is a normal name there. */
const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯豈-﫿]/;

export interface OsmCleanupStats {
  before: number;
  duplicates: number;
  junk: number;
  closed: number;
  after: number;
}

/** True when OSM marks the object as no longer in use (disused:*, abandoned:*, was:*). Applies to hospitals too. */
export function hasClosedLifecycleTag(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false;
  return Object.keys(tags).some((key) => LIFECYCLE_TAG.test(key));
}

export function normalizeOsmName(name: string): string {
  return name.trim().toLowerCase();
}

export function hasCjk(name: string): boolean {
  return CJK.test(name);
}

/** Hospitals are never merged as duplicates and never dropped as junk (only closed tags hide them). */
export function isHospital(org: Organization): boolean {
  return org.osmKind === "hospital";
}

const filled = (value: string | undefined) => Boolean(value?.trim());

/** Number of filled fields among phone, website, address and hours (more = richer record). */
export function osmRichness(org: Organization): number {
  return [org.phone, org.website, org.address, org.hoursRaw].filter(filled).length;
}

/** Digits of each number in "a; b, c" lists, compared by their last 9 digits (ignores country-code and leading-0 prefixes). */
function phoneKeys(phone: string): Set<string> {
  const keys = new Set<string>();
  for (const part of phone.split(/[;,/]/)) {
    const digits = part.replace(/\D/g, "");
    if (digits.length >= 5) keys.add(digits.slice(-9));
  }
  return keys;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Both have an address and neither contains the other (different street/number), or both have disjoint phones. */
function contactsConflict(a: Organization, b: Organization): boolean {
  if (filled(a.address) && filled(b.address)) {
    const x = normalizeAddress(a.address);
    const y = normalizeAddress(b.address);
    if (x && y && !x.includes(y) && !y.includes(x)) return true;
  }
  if (filled(a.phone) && filled(b.phone)) {
    const x = phoneKeys(a.phone);
    const y = phoneKeys(b.phone);
    if (x.size > 0 && y.size > 0 && ![...x].some((key) => y.has(key))) return true;
  }
  return false;
}

function metersBetween(a: Organization, b: Organization): number {
  return distanceMiles(a.lat, a.lng, b.lat, b.lng) * METERS_PER_MILE;
}

/**
 * Same normalized name within 100 m and no conflicting address or phone: keep the richest
 * record (first one on a tie). Hospitals are never merged. Order of the kept records is unchanged.
 */
export function dedupeOsmOrganizations(orgs: Organization[]): Organization[] {
  const byRichness = orgs
    .map((org, index) => ({ org, index }))
    .sort((a, b) => osmRichness(b.org) - osmRichness(a.org) || a.index - b.index);

  const keptByName = new Map<string, Organization[]>();
  const keptIndexes = new Set<number>();

  for (const { org, index } of byRichness) {
    if (isHospital(org)) {
      keptIndexes.add(index);
      continue;
    }
    const key = normalizeOsmName(org.name);
    const group = keptByName.get(key) ?? [];
    const isDuplicate = group.some(
      (kept) => metersBetween(kept, org) < DUPLICATE_RADIUS_METERS && !contactsConflict(kept, org),
    );
    if (isDuplicate) continue;
    group.push(org);
    keptByName.set(key, group);
    keptIndexes.add(index);
  }

  return orgs.filter((_, index) => keptIndexes.has(index));
}

/**
 * Junk: a name under 4 characters (without CJK characters) on a record with no phone,
 * website or address. Hospitals are never removed by this rule.
 */
export function removeJunkOsmOrganizations(orgs: Organization[]): Organization[] {
  return orgs.filter((org) => {
    if (isHospital(org)) return true;
    const noContacts = !filled(org.phone) && !filled(org.website) && !filled(org.address);
    if (!noContacts) return true;
    const name = normalizeOsmName(org.name);
    return name.length >= MIN_NAME_LENGTH || hasCjk(name);
  });
}

/** Duplicates first, then junk; closed objects are dropped earlier, per element (they have the tags). */
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
