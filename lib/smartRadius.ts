import type { Organization } from "@/lib/types";

/** Progressive search radii (meters). */
export const RADIUS_TIERS_STANDARD = [5_000, 15_000, 40_000] as const;
export const RADIUS_TIERS_LITE = [10_000, 25_000, 50_000] as const;

export const MIN_RESULTS_FOR_RADIUS = 3;
export const NEAREST_FALLBACK_COUNT = 5;

export type SearchRadiusMode = "within" | "nearest";

export interface SmartRadiusSearchResult {
  organizations: Organization[];
  activeRadiusMeters: number;
  mode: SearchRadiusMode;
  canExpand: boolean;
  nextRadiusMeters: number | null;
  /** Furthest distance (km) among shown orgs when mode is `nearest`. */
  farthestKm: number | null;
}

export function getRadiusTiers(liteMode: boolean): readonly number[] {
  return liteMode ? RADIUS_TIERS_LITE : RADIUS_TIERS_STANDARD;
}

export function getMaxRadiusMeters(liteMode: boolean): number {
  const tiers = getRadiusTiers(liteMode);
  return tiers[tiers.length - 1]!;
}

export function metersToDisplayKm(meters: number): number {
  return Math.round(meters / 100) / 10;
}

export function getTierIndex(
  radiusMeters: number,
  liteMode: boolean,
): number {
  const tiers = getRadiusTiers(liteMode);
  const idx = tiers.indexOf(radiusMeters);
  return idx >= 0 ? idx : 0;
}

export function parseDistanceMiles(distance: string): number {
  if (!distance) return 9999;
  const match = distance.match(/^([\d.]+)\s*(mi|ft)?/i);
  if (!match) return 9999;
  const value = Number(match[1]);
  return match[2]?.toLowerCase() === "ft" ? value / 5280 : value;
}

export function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 10) / 10;
}

function sortByDistance(orgs: Organization[]): Organization[] {
  return [...orgs].sort(
    (a, b) => parseDistanceMiles(a.distance) - parseDistanceMiles(b.distance),
  );
}

function farthestKmFromUser(orgs: Organization[]): number | null {
  if (orgs.length === 0) return null;
  const miles = Math.max(...orgs.map((o) => parseDistanceMiles(o.distance)));
  return milesToKm(miles);
}

export interface FetchAtRadiusFn {
  (radiusMeters: number): Promise<Organization[]>;
}

/**
 * Search with tiered radii: auto-expand while fewer than MIN_RESULTS_FOR_RADIUS,
 * then fall back to the nearest NEAREST_FALLBACK_COUNT orgs within max radius.
 */
export async function runSmartRadiusSearch(
  fetchAtRadius: FetchAtRadiusFn,
  options: {
    liteMode: boolean;
    startTierIndex?: number;
    autoExpand?: boolean;
  },
): Promise<SmartRadiusSearchResult> {
  const tiers = getRadiusTiers(options.liteMode);
  const startIndex = options.startTierIndex ?? 0;
  const autoExpand = options.autoExpand !== false;

  let lastOrgs: Organization[] = [];
  let lastRadius = tiers[startIndex] ?? tiers[0]!;

  for (let i = startIndex; i < tiers.length; i++) {
    const radius = tiers[i]!;
    lastRadius = radius;
    lastOrgs = await fetchAtRadius(radius);

    const isLastTier = i === tiers.length - 1;
    const needsMore = lastOrgs.length < MIN_RESULTS_FOR_RADIUS;

    if (autoExpand && needsMore && !isLastTier) {
      continue;
    }

    if (needsMore && isLastTier) {
      const nearest = sortByDistance(lastOrgs).slice(0, NEAREST_FALLBACK_COUNT);
      return {
        organizations: nearest,
        activeRadiusMeters: radius,
        mode: "nearest",
        canExpand: false,
        nextRadiusMeters: null,
        farthestKm: farthestKmFromUser(nearest),
      };
    }

    return {
      organizations: lastOrgs,
      activeRadiusMeters: radius,
      mode: "within",
      canExpand: !isLastTier,
      nextRadiusMeters: isLastTier ? null : tiers[i + 1]!,
      farthestKm: null,
    };
  }

  const nearest = sortByDistance(lastOrgs).slice(0, NEAREST_FALLBACK_COUNT);
  return {
    organizations: nearest,
    activeRadiusMeters: lastRadius,
    mode: "nearest",
    canExpand: false,
    nextRadiusMeters: null,
    farthestKm: farthestKmFromUser(nearest),
  };
}
