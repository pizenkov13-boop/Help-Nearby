import { fetchOrganizations } from "@/lib/data";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import {
  runSmartRadiusSearch,
  type SmartRadiusSearchResult,
} from "@/lib/smartRadius";
import type { Organization, UserLocation } from "@/lib/types";

export type { SmartRadiusSearchResult };

async function fetchVerifiedNearby(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  if (!country?.trim()) return [];

  try {
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radiusMeters),
      country: country.trim(),
    });
    if (countryCode) {
      params.set("countryCode", countryCode);
    }

    const res = await fetch(`/api/nearby?${params}`);
    const data = (await res.json()) as unknown;
    if (!res.ok) {
      console.warn("[nearbySearch] /api/nearby status:", res.status);
    }
    return Array.isArray(data) ? (data as Organization[]) : [];
  } catch (error) {
    console.error("[nearbySearch] HDX/GDHO fetch failed:", error);
    return [];
  }
}

export async function fetchMergedNearby(
  location: UserLocation,
  radiusMeters: number,
  country?: string,
  countryCode?: string | null,
): Promise<Organization[]> {
  const catalog = await fetchOrganizations(location, {
    country,
    radiusMeters,
  });
  const verified = await fetchVerifiedNearby(
    location,
    radiusMeters,
    country,
    countryCode,
  );
  return mergeOrganizations(catalog, verified);
}

export async function searchNearbyWithSmartRadius(
  location: UserLocation,
  options: {
    liteMode: boolean;
    country?: string;
    countryCode?: string | null;
    startTierIndex?: number;
    autoExpand?: boolean;
  },
): Promise<SmartRadiusSearchResult> {
  const fetchAtRadius = (radiusMeters: number) =>
    fetchMergedNearby(
      location,
      radiusMeters,
      options.country,
      options.countryCode,
    );

  return runSmartRadiusSearch(fetchAtRadius, {
    liteMode: options.liteMode,
    startTierIndex: options.startTierIndex,
    autoExpand: options.autoExpand,
  });
}
