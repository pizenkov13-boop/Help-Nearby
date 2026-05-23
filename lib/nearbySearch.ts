import { fetchOrganizations } from "@/lib/data";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import {
  runSmartRadiusSearch,
  type SmartRadiusSearchResult,
} from "@/lib/smartRadius";
import type { Organization, UserLocation } from "@/lib/types";

export type { SmartRadiusSearchResult };

async function fetchOverpassNearby(
  location: UserLocation,
  radiusMeters: number,
): Promise<Organization[]> {
  try {
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radiusMeters),
    });
    const res = await fetch(`/api/nearby?${params}`);
    const data = (await res.json()) as unknown;
    if (!res.ok) {
      console.warn("[nearbySearch] /api/nearby status:", res.status);
    }
    return Array.isArray(data) ? (data as Organization[]) : [];
  } catch (error) {
    console.error("[nearbySearch] Overpass fetch failed:", error);
    return [];
  }
}

export async function fetchMergedNearby(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
): Promise<Organization[]> {
  const catalog = await fetchOrganizations(location, {
    country,
    radiusMeters,
  });
  const overpass = await fetchOverpassNearby(location, radiusMeters);
  return mergeOrganizations(catalog, overpass);
}

export async function searchNearbyWithSmartRadius(
  location: UserLocation,
  options: {
    liteMode: boolean;
    country?: string;
    startTierIndex?: number;
    autoExpand?: boolean;
  },
): Promise<SmartRadiusSearchResult> {
  const fetchAtRadius = (radiusMeters: number) =>
    fetchMergedNearby(location, radiusMeters, options.country);

  return runSmartRadiusSearch(fetchAtRadius, {
    liteMode: options.liteMode,
    startTierIndex: options.startTierIndex,
    autoExpand: options.autoExpand,
  });
}
