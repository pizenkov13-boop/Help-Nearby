import { fetchOrganizations } from "@/lib/data";
import { validateOrganizationForNearby } from "@/lib/organizationCoordinates";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import {
  readOverpassClientCache,
  writeOverpassClientCache,
} from "@/lib/overpassClientCache";
import { OVERPASS_TIMEOUT_MS } from "@/lib/overpassCache";
import {
  getMaxRadiusMeters,
  runSmartRadiusSearch,
  type SmartRadiusSearchResult,
} from "@/lib/smartRadius";
import type { Organization, UserLocation } from "@/lib/types";

export type { SmartRadiusSearchResult };

const EXTERNAL_FETCH_TIMEOUT_MS = OVERPASS_TIMEOUT_MS;

export interface MergedNearbyResult {
  organizations: Organization[];
  externalTimedOut: boolean;
}

export interface NearbySearchCallbacks {
  /** Fired when Supabase catalog is ready (before Overpass). */
  onOrganizationsUpdate?: (organizations: Organization[]) => void;
  onExternalTimeout?: () => void;
}

export interface SmartRadiusSearchOptions {
  liteMode: boolean;
  country?: string;
  countryCode?: string | null;
  startTierIndex?: number;
  autoExpand?: boolean;
}

export type SmartRadiusSearchResultWithMeta = SmartRadiusSearchResult & {
  externalTimedOut: boolean;
};

function filterByRadius(
  orgs: Organization[],
  location: UserLocation,
  radiusMeters: number,
): Organization[] {
  return orgs
    .map((org) => validateOrganizationForNearby(org, location, radiusMeters))
    .filter((org): org is Organization => org !== null);
}

async function fetchOverpassNearby(
  location: UserLocation,
  radiusMeters: number,
  signal?: AbortSignal,
): Promise<Organization[]> {
  const cached = readOverpassClientCache(
    location.lat,
    location.lng,
    radiusMeters,
  );
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    radius: String(radiusMeters),
  });

  const res = await fetch(`/api/nearby?${params}`, { signal });
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    console.warn("[nearbySearch] /api/nearby status:", res.status);
    return [];
  }

  const organizations = Array.isArray(data) ? (data as Organization[]) : [];
  if (organizations.length > 0) {
    writeOverpassClientCache(
      location.lat,
      location.lng,
      radiusMeters,
      organizations,
    );
  }
  return organizations;
}

async function fetchOverpassWithTimeout(
  location: UserLocation,
  radiusMeters: number,
): Promise<{ organizations: Organization[]; timedOut: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    EXTERNAL_FETCH_TIMEOUT_MS,
  );

  try {
    const organizations = await fetchOverpassNearby(
      location,
      radiusMeters,
      controller.signal,
    );
    return { organizations, timedOut: false };
  } catch (error) {
    if (controller.signal.aborted) {
      console.warn(
        `[nearbySearch] Overpass timed out after ${EXTERNAL_FETCH_TIMEOUT_MS / 1000}s`,
      );
      const stale = readOverpassClientCache(
        location.lat,
        location.lng,
        radiusMeters,
      );
      return { organizations: stale ?? [], timedOut: true };
    }
    console.error("[nearbySearch] Overpass fetch failed:", error);
    return { organizations: [], timedOut: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch Supabase catalog and Overpass in parallel.
 * Catalog results surface immediately; Overpass merges when ready.
 */
export async function fetchMergedNearbyParallel(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  callbacks?: Pick<
    NearbySearchCallbacks,
    "onOrganizationsUpdate" | "onExternalTimeout"
  >,
  externalOrgs?: Organization[],
): Promise<MergedNearbyResult> {
  const catalogPromise = fetchOrganizations(location, {
    country,
    radiusMeters,
  });

  const externalPromise =
    externalOrgs !== undefined
      ? Promise.resolve({ organizations: externalOrgs, timedOut: false })
      : fetchOverpassWithTimeout(location, radiusMeters);

  const catalog = await catalogPromise;
  callbacks?.onOrganizationsUpdate?.(mergeOrganizations(catalog, []));

  const externalResult = await externalPromise;

  if (externalResult.timedOut) {
    callbacks?.onExternalTimeout?.();
  }

  const organizations = mergeOrganizations(
    catalog,
    filterByRadius(externalResult.organizations, location, radiusMeters),
  );
  callbacks?.onOrganizationsUpdate?.(organizations);

  return {
    organizations,
    externalTimedOut: externalResult.timedOut,
  };
}

/** @deprecated Use fetchMergedNearbyParallel */
export async function fetchMergedNearby(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
): Promise<Organization[]> {
  const result = await fetchMergedNearbyParallel(
    location,
    radiusMeters,
    country,
  );
  return result.organizations;
}

export async function searchNearbyWithSmartRadius(
  location: UserLocation,
  options: SmartRadiusSearchOptions,
  callbacks?: NearbySearchCallbacks,
): Promise<SmartRadiusSearchResultWithMeta> {
  let externalTimedOut = false;
  const maxRadius = getMaxRadiusMeters(options.liteMode);

  const catalogAtMaxPromise = fetchOrganizations(location, {
    country: options.country,
    radiusMeters: maxRadius,
  });

  const overpassAtMaxPromise = fetchOverpassWithTimeout(location, maxRadius);

  const fetchAtRadius = async (radiusMeters: number) => {
    const catalogAtMax = await catalogAtMaxPromise;
    const catalog = filterByRadius(catalogAtMax, location, radiusMeters);
    callbacks?.onOrganizationsUpdate?.(mergeOrganizations(catalog, []));

    const overpassResult = await overpassAtMaxPromise;
    if (overpassResult.timedOut) {
      externalTimedOut = true;
      callbacks?.onExternalTimeout?.();
    }

    const overpass = filterByRadius(
      overpassResult.organizations,
      location,
      radiusMeters,
    );

    const merged = mergeOrganizations(catalog, overpass);
    callbacks?.onOrganizationsUpdate?.(merged);

    return merged;
  };

  const searchResult = await runSmartRadiusSearch(fetchAtRadius, {
    liteMode: options.liteMode,
    startTierIndex: options.startTierIndex,
    autoExpand: options.autoExpand,
  });

  return { ...searchResult, externalTimedOut };
}
