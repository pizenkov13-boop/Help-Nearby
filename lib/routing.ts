import type { UserLocation } from "@/lib/types";

export type RoutingMode = "driving" | "walking" | "transit";

export interface RouteData {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  mode: RoutingMode;
}

export function getOsrmProfile(mode: RoutingMode): string {
  if (mode === "walking") return "foot";
  return "driving";
}

export async function fetchRoute(
  from: UserLocation,
  to: { lat: number; lng: number },
  mode: RoutingMode,
): Promise<RouteData> {
  const params = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
    mode,
  });

  const response = await fetch(`/api/route?${params}`);
  const data = (await response.json()) as RouteData & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to fetch route");
  }

  return data;
}
