import { geocodeVerifiedCatalog } from "@/lib/geocodeVerifiedCatalog";
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
const VERIFIED_FETCH_TIMEOUT_MS = 20_000;

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

/** Supabase catalog via server API (avoids browser → supabase.co blocks). */
async function fetchSupabaseCatalog(
  location: UserLocation,
  country: string | undefined,
  radiusMeters: number,
  liteMode = false,
): Promise<Organization[]> {
  const params = new URLSearchParams();
  if (country) {
    params.set("country", country);
  } else {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("radius", String(radiusMeters));
  }

  try {
    const res = await fetch(`/api/organizations?${params}`);
    const data = (await res.json()) as unknown;
    if (!res.ok || !Array.isArray(data)) {
      console.warn("[nearbySearch] /api/organizations status:", res.status);
      return [];
    }

    let catalog = data as Organization[];

    if (country) {
      catalog = await geocodeVerifiedCatalog(catalog, { liteMode });
      return filterByRadius(catalog, location, radiusMeters);
    }

    return catalog;
  } catch (error) {
    console.warn("[nearbySearch] Supabase catalog fetch failed:", error);
    return [];
  }
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

async function fetchVerifiedNearby(
  location: UserLocation,
  radiusMeters: number,
  country: string,
  countryCode: string | null | undefined,
  signal?: AbortSignal,
): Promise<Organization[]> {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    radius: String(radiusMeters),
    country,
  });
  if (countryCode) {
    params.set("countryCode", countryCode);
  }

  const res = await fetch(`/api/verified-nearby?${params}`, { signal });
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    console.warn("[nearbySearch] /api/verified-nearby status:", res.status);
    return [];
  }

  return Array.isArray(data) ? (data as Organization[]) : [];
}

async function fetchVerifiedNearbyWithTimeout(
  location: UserLocation,
  radiusMeters: number,
  country: string | undefined,
  countryCode?: string | null,
): Promise<{ organizations: Organization[]; timedOut: boolean }> {
  if (!country?.trim()) {
    return { organizations: [], timedOut: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    VERIFIED_FETCH_TIMEOUT_MS,
  );

  try {
    const organizations = await fetchVerifiedNearby(
      location,
      radiusMeters,
      country,
      countryCode,
      controller.signal,
    );
    return { organizations, timedOut: false };
  } catch (error) {
    if (controller.signal.aborted) {
      console.warn(
        `[nearbySearch] verified sources timed out after ${VERIFIED_FETCH_TIMEOUT_MS / 1000}s`,
      );
      return { organizations: [], timedOut: true };
    }
    console.error("[nearbySearch] verified sources fetch failed:", error);
    return { organizations: [], timedOut: false };
  } finally {
    clearTimeout(timeoutId);
  }
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
function mergeAllNearbySources(
  catalog: Organization[],
  overpass: Organization[],
  verified: Organization[],
): Organization[] {
  return mergeOrganizations(
    mergeOrganizations(catalog, overpass),
    verified,
  );
}

export async function fetchMergedNearbyParallel(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  callbacks?: Pick<
    NearbySearchCallbacks,
    "onOrganizationsUpdate" | "onExternalTimeout"
  >,
  externalOrgs?: Organization[],
  countryCode?: string | null,
): Promise<MergedNearbyResult> {
  const catalogPromise = fetchSupabaseCatalog(location, country, radiusMeters);

  const externalPromise =
    externalOrgs !== undefined
      ? Promise.resolve({ organizations: externalOrgs, timedOut: false })
      : fetchOverpassWithTimeout(location, radiusMeters);

  const verifiedPromise = fetchVerifiedNearbyWithTimeout(
    location,
    radiusMeters,
    country,
    countryCode,
  );

  const catalog = await catalogPromise;
  callbacks?.onOrganizationsUpdate?.(mergeOrganizations(catalog, []));

  const [externalResult, verifiedResult] = await Promise.all([
    externalPromise,
    verifiedPromise,
  ]);

  if (externalResult.timedOut || verifiedResult.timedOut) {
    callbacks?.onExternalTimeout?.();
  }

  const organizations = mergeAllNearbySources(
    catalog,
    filterByRadius(externalResult.organizations, location, radiusMeters),
    filterByRadius(verifiedResult.organizations, location, radiusMeters),
  );
  callbacks?.onOrganizationsUpdate?.(organizations);

  return {
    organizations,
    externalTimedOut: externalResult.timedOut || verifiedResult.timedOut,
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

  const catalogAtMaxPromise = fetchSupabaseCatalog(
    location,
    options.country,
    maxRadius,
    options.liteMode,
  );

  const overpassAtMaxPromise = fetchOverpassWithTimeout(location, maxRadius);
  const verifiedAtMaxPromise = fetchVerifiedNearbyWithTimeout(
    location,
    maxRadius,
    options.country,
    options.countryCode,
  );

  const fetchAtRadius = async (radiusMeters: number) => {
    const catalogAtMax = await catalogAtMaxPromise;
    const catalog = filterByRadius(catalogAtMax, location, radiusMeters);
    callbacks?.onOrganizationsUpdate?.(mergeOrganizations(catalog, []));

    const [overpassResult, verifiedResult] = await Promise.all([
      overpassAtMaxPromise,
      verifiedAtMaxPromise,
    ]);

    if (overpassResult.timedOut || verifiedResult.timedOut) {
      externalTimedOut = true;
      callbacks?.onExternalTimeout?.();
    }

    const overpass = filterByRadius(
      overpassResult.organizations,
      location,
      radiusMeters,
    );
    const verified = filterByRadius(
      verifiedResult.organizations,
      location,
      radiusMeters,
    );

    const merged = mergeAllNearbySources(catalog, overpass, verified);
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
