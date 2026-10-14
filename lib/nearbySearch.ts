import { mergeOrganizations } from "@/lib/mergeOrganizations";
import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { organizationNeedsGeocoding } from "@/lib/nominatimGeocode";
import { validateOrganizationForNearby } from "@/lib/organizationCoordinates";
import {
  readOverpassClientCache,
  writeOverpassClientCache,
} from "@/lib/overpassClientCache";
import { resolveOrganizationCoordinates } from "@/lib/resolveOrganizationCoordinates";
import { readSessionCache, writeSessionCache } from "@/lib/sessionCache";
import {
  getMaxRadiusMeters,
  getRadiusTiers,
  runSmartRadiusSearch,
  type SmartRadiusSearchResult,
} from "@/lib/smartRadius";
import { searchCacheKey } from "@/lib/ttlCache";
import type { Organization, UserLocation } from "@/lib/types";

export type { SmartRadiusSearchResult };

/** Client-side budgets (slightly above the server's so the server's answer wins). */
export const SUPABASE_FETCH_TIMEOUT_MS = 5_000;
export const OVERPASS_FETCH_TIMEOUT_MS = 9_000;
export const OCHA_FETCH_TIMEOUT_MS = 7_000;

const MAX_BACKGROUND_GEOCODE_OCHA = 12;
const MAX_BACKGROUND_GEOCODE_CATALOG = 8;
const GEOCODE_DELAY_MS = 1100;
const OCHA_GEOCODE_PER_SOURCE = 4;

export type SourceKey = "supabase" | "osm" | "ocha";
export type SourceStatus = "pending" | "done" | "failed" | "timeout";
export type NearbySourceStates = Record<SourceKey, SourceStatus>;

export interface NearbySearchCallbacks {
  /** Fired every time any source finishes, with everything known so far. */
  onOrganizationsUpdate?: (organizations: Organization[]) => void;
  /** Fired as background geocoding adds coordinates to already-listed entries. */
  onOrganizationsPatch?: (patched: Organization[]) => void;
  onSourceStatus?: (states: NearbySourceStates) => void;
  onExternalTimeout?: () => void;
}

export interface SmartRadiusSearchOptions {
  liteMode: boolean;
  country?: string;
  countryCode?: string | null;
  startTierIndex?: number;
  autoExpand?: boolean;
  /** Aborts background geocoding when a newer search starts. */
  signal?: AbortSignal;
}

export type SmartRadiusSearchResultWithMeta = SmartRadiusSearchResult & {
  externalTimedOut: boolean;
};

interface SourceResult {
  organizations: Organization[];
  status: Exclude<SourceStatus, "pending">;
}

function filterByRadius(
  orgs: Organization[],
  location: UserLocation,
  radiusMeters: number,
): Organization[] {
  return orgs
    .map((org) => validateOrganizationForNearby(org, location, radiusMeters))
    .filter((org): org is Organization => org !== null);
}

function mergeAllNearbySources(
  catalog: Organization[],
  overpass: Organization[],
  verified: Organization[],
): Organization[] {
  return mergeOrganizations(mergeOrganizations(catalog, overpass), verified);
}

/** Fetches JSON with an abort timeout; distinguishes timeout from other failures. */
async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<{ ok: true; data: unknown } | { ok: false; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return { ok: false, timedOut: res.status === 504 };
    }
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, timedOut: controller.signal.aborted };
  } finally {
    clearTimeout(timer);
  }
}

/** Supabase catalog via server API (avoids browser → supabase.co blocks). */
async function fetchSupabaseCatalog(
  location: UserLocation,
  country: string | undefined,
  radiusMeters: number,
): Promise<SourceResult> {
  const cacheKey = searchCacheKey(
    "catalog",
    location.lat,
    location.lng,
    radiusMeters,
    "all",
    country ?? "",
  );
  const cached = readSessionCache<Organization[]>(cacheKey);
  if (cached) return { organizations: cached, status: "done" };

  const params = new URLSearchParams();
  if (country) {
    params.set("country", country);
  } else {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    params.set("radius", String(radiusMeters));
  }

  const result = await fetchJsonWithTimeout(
    `/api/organizations?${params}`,
    SUPABASE_FETCH_TIMEOUT_MS,
  );
  if (!result.ok || !Array.isArray(result.data)) {
    return {
      organizations: [],
      status: result.ok ? "failed" : result.timedOut ? "timeout" : "failed",
    };
  }

  const organizations = result.data as Organization[];
  if (organizations.length > 0) writeSessionCache(cacheKey, organizations);
  return { organizations, status: "done" };
}

async function fetchOverpassNearby(
  location: UserLocation,
  radiusMeters: number,
): Promise<SourceResult> {
  const cached = readOverpassClientCache(location.lat, location.lng, radiusMeters);
  if (cached) return { organizations: cached, status: "done" };

  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    radius: String(radiusMeters),
  });

  const result = await fetchJsonWithTimeout(
    `/api/nearby?${params}`,
    OVERPASS_FETCH_TIMEOUT_MS,
  );
  if (!result.ok) {
    const stale = readOverpassClientCache(location.lat, location.lng, radiusMeters);
    return {
      organizations: stale ?? [],
      status: result.timedOut ? "timeout" : "failed",
    };
  }

  const organizations = Array.isArray(result.data)
    ? (result.data as Organization[])
    : [];
  if (organizations.length > 0) {
    writeOverpassClientCache(location.lat, location.lng, radiusMeters, organizations);
  }
  return { organizations, status: "done" };
}

/** Country-level OCHA directory (no coordinates) — fast, geocoded later in the background. */
async function fetchOchaDirectory(
  country: string | undefined,
  countryCode: string | null | undefined,
): Promise<SourceResult> {
  if (!country?.trim()) return { organizations: [], status: "done" };

  const cacheKey = `ocha:${country.toLowerCase()}:${countryCode ?? ""}`;
  const cached = readSessionCache<Organization[]>(cacheKey);
  if (cached) return { organizations: cached, status: "done" };

  const params = new URLSearchParams({ country, stage: "directory" });
  if (countryCode) params.set("countryCode", countryCode);

  const result = await fetchJsonWithTimeout(
    `/api/verified-nearby?${params}`,
    OCHA_FETCH_TIMEOUT_MS,
  );
  if (!result.ok || !Array.isArray(result.data)) {
    return {
      organizations: [],
      status: result.ok ? "failed" : result.timedOut ? "timeout" : "failed",
    };
  }

  const organizations = result.data as Organization[];
  if (organizations.length > 0) writeSessionCache(cacheKey, organizations);
  return { organizations, status: "done" };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A few entries per OCHA source first, so one source cannot use up the whole budget. */
function pickOchaForGeocoding(orgs: Organization[]): Organization[] {
  const bySource = (prefix: string) =>
    orgs.filter((org) => org.id.startsWith(prefix)).slice(0, OCHA_GEOCODE_PER_SOURCE);
  const picked = [...bySource("rw-"), ...bySource("hdx-"), ...bySource("gdho-")];
  const rest = orgs.filter((org) => !picked.includes(org));
  return [...picked, ...rest].slice(0, MAX_BACKGROUND_GEOCODE_OCHA);
}

/** Nominatim-limited (≥1.1 s apart), cancellable, never blocks the search. */
async function geocodeInBackground(
  orgs: Organization[],
  max: number,
  signal: AbortSignal | undefined,
  onResolved: (org: Organization) => void,
): Promise<void> {
  let attempted = 0;
  for (const org of orgs) {
    if (signal?.aborted || attempted >= max) return;
    if (!organizationNeedsGeocoding(org)) continue;

    const resolved = await resolveOrganizationCoordinates(org);
    attempted += 1;
    if (signal?.aborted) return;
    if (hasValidMapCoordinates(resolved)) onResolved(resolved);
    if (attempted < max) await sleep(GEOCODE_DELAY_MS);
  }
}

/**
 * Starts all sources at once and surfaces each as it finishes:
 * Supabase first, then OSM and the OCHA directory, merged without resetting the list.
 */
export async function searchNearbyWithSmartRadius(
  location: UserLocation,
  options: SmartRadiusSearchOptions,
  callbacks?: NearbySearchCallbacks,
): Promise<SmartRadiusSearchResultWithMeta> {
  const tiers = getRadiusTiers(options.liteMode);
  const maxRadius = getMaxRadiusMeters(options.liteMode);
  let activeRadius = tiers[options.startTierIndex ?? 0] ?? tiers[0]!;

  const states: NearbySourceStates = {
    supabase: "pending",
    osm: "pending",
    ocha: options.country?.trim() ? "pending" : "done",
  };
  let catalog: Organization[] = [];
  let overpass: Organization[] = [];
  let ocha: Organization[] = [];
  let externalTimedOut = false;

  const emitStatus = () => callbacks?.onSourceStatus?.({ ...states });
  const mergedAt = (radius: number) =>
    mergeAllNearbySources(
      filterByRadius(catalog, location, radius),
      filterByRadius(overpass, location, radius),
      ocha,
    );
  const emitOrganizations = () =>
    callbacks?.onOrganizationsUpdate?.(mergedAt(activeRadius));

  const settle = (key: SourceKey, result: SourceResult) => {
    states[key] = result.status;
    if (result.status === "timeout") {
      externalTimedOut = true;
      callbacks?.onExternalTimeout?.();
    }
    emitStatus();
  };

  const patchOrganization = (resolved: Organization, target: "catalog" | "ocha") => {
    const replace = (list: Organization[]) =>
      list.map((org) => (org.id === resolved.id ? resolved : org));
    if (target === "ocha") ocha = replace(ocha);
    else catalog = replace(catalog);
    callbacks?.onOrganizationsPatch?.([resolved]);
  };

  emitStatus();

  const catalogPromise = fetchSupabaseCatalog(location, options.country, maxRadius).then(
    (result) => {
      catalog = result.organizations;
      settle("supabase", result);
      emitOrganizations();
      if (!options.liteMode) {
        void geocodeInBackground(
          result.organizations.filter((org) => !hasValidMapCoordinates(org)),
          MAX_BACKGROUND_GEOCODE_CATALOG,
          options.signal,
          (org) => patchOrganization(org, "catalog"),
        );
      }
      return result;
    },
  );

  const overpassPromise = fetchOverpassNearby(location, maxRadius).then((result) => {
    overpass = result.organizations;
    settle("osm", result);
    emitOrganizations();
    return result;
  });

  const ochaPromise = fetchOchaDirectory(options.country, options.countryCode).then(
    (result) => {
      ocha = result.organizations;
      if (options.country?.trim()) settle("ocha", result);
      emitOrganizations();
      if (!options.liteMode) {
        void geocodeInBackground(
          pickOchaForGeocoding(result.organizations),
          MAX_BACKGROUND_GEOCODE_OCHA,
          options.signal,
          (org) => patchOrganization(org, "ocha"),
        );
      }
      return result;
    },
  );

  const fetchAtRadius = async (radiusMeters: number) => {
    activeRadius = radiusMeters;
    await Promise.all([catalogPromise, overpassPromise, ochaPromise]);

    // Radius expansion is driven by mappable results; list-only OCHA entries are added at the end.
    const mappable = mergedAt(radiusMeters).filter(hasValidMapCoordinates);
    callbacks?.onOrganizationsUpdate?.(mergedAt(radiusMeters));
    return mappable;
  };

  const searchResult = await runSmartRadiusSearch(fetchAtRadius, {
    liteMode: options.liteMode,
    startTierIndex: options.startTierIndex,
    autoExpand: options.autoExpand,
  });

  const organizations = mergeOrganizations(
    searchResult.organizations,
    ocha.filter((org) => !hasValidMapCoordinates(org)),
  );

  return { ...searchResult, organizations, externalTimedOut };
}
