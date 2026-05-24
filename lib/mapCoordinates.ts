import type { Organization } from "@/lib/types";

/** True when lat/lng are usable for Leaflet markers and routing. */
export function hasValidMapCoordinates(org: Organization): boolean {
  const { lat, lng } = org;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (Math.abs(lat) < 0.001 || Math.abs(lng) < 0.001) return false;
  return true;
}
