import type { Organization } from "@/lib/types";

/** True when lat/lng are usable for Leaflet markers. */
export function hasValidMapCoordinates(org: Organization): boolean {
  const { lat, lng } = org;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
