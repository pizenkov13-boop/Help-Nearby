import { fetchOrganizations } from "@/lib/data";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import {
  runSmartRadiusSearch,
  type SmartRadiusSearchResult,
} from "@/lib/smartRadius";
import type { Organization, UserLocation } from "@/lib/types";

export type { SmartRadiusSearchResult };

const EXTERNAL_FETCH_TIMEOUT_MS = 8_000;

export interface MergedNearbyResult {
  organizations: Organization[];
  externalTimedOut: boolean;
}

export interface NearbySearchCallbacks {
  /** Fired when Supabase catalog is ready (before HDX/GDHO). */
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
    country: country.trim(),
  });
  if (countryCode) {
    params.set("countryCode", countryCode);
  }

  const res = await fetch(`/api/nearby?${params}`, { signal });
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    console.warn("[nearbySearch] /api/nearby status:", res.status);
  }
  return Array.isArray(data) ? (data as Organization[]) : [];
}

async function fetchVerifiedNearbyWithTimeout(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  countryCode?: string | null,
): Promise<{ organizations: Organization[]; timedOut: boolean }> {
  if (!country?.trim()) {
    return { organizations: [], timedOut: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);

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
      console.warn("[nearbySearch] HDX/GDHO timed out after 8s");
      return { organizations: [], timedOut: true };
    }
    console.error("[nearbySearch] HDX/GDHO fetch failed:", error);
    return { organizations: [], timedOut: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch Supabase catalog and HDX/GDHO in parallel.
 * Supabase results are surfaced via onCatalogReady before external data arrives.
 */
export async function fetchMergedNearbyParallel(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  countryCode?: string | null,
  callbacks?: Pick<NearbySearchCallbacks, "onOrganizationsUpdate" | "onExternalTimeout">,
): Promise<MergedNearbyResult> {
  const catalogPromise = fetchOrganizations(location, {
    country,
    radiusMeters,
  });

  const externalPromise = fetchVerifiedNearbyWithTimeout(
    location,
    radiusMeters,
    country,
    countryCode,
  );

  const catalog = await catalogPromise;
  callbacks?.onOrganizationsUpdate?.(mergeOrganizations(catalog, []));

  const externalResult = await externalPromise;

  if (externalResult.timedOut) {
    callbacks?.onExternalTimeout?.();
  }

  const organizations = mergeOrganizations(
    catalog,
    externalResult.organizations,
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
  countryCode?: string | null,
): Promise<Organization[]> {
  const result = await fetchMergedNearbyParallel(
    location,
    radiusMeters,
    country,
    countryCode,
  );
  return result.organizations;
}

export async function searchNearbyWithSmartRadius(
  location: UserLocation,
  options: SmartRadiusSearchOptions,
  callbacks?: NearbySearchCallbacks,
): Promise<SmartRadiusSearchResultWithMeta> {
  let externalTimedOut = false;

  const fetchAtRadius = async (radiusMeters: number) => {
    const result = await fetchMergedNearbyParallel(
      location,
      radiusMeters,
      options.country,
      options.countryCode,
      {
        onOrganizationsUpdate: callbacks?.onOrganizationsUpdate,
        onExternalTimeout: () => {
          externalTimedOut = true;
          callbacks?.onExternalTimeout?.();
        },
      },
    );
    if (result.externalTimedOut) {
      externalTimedOut = true;
    }
    return result.organizations;
  };

  const searchResult = await runSmartRadiusSearch(fetchAtRadius, {
    liteMode: options.liteMode,
    startTierIndex: options.startTierIndex,
    autoExpand: options.autoExpand,
  });

  return { ...searchResult, externalTimedOut };
}
