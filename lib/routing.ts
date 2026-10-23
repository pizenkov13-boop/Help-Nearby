import { postJson } from "@/lib/postJson";
import type { UserLocation } from "@/lib/types";

export type RoutingMode = "driving" | "walking";

export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationS: number;
}

export interface RouteData {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  mode: RoutingMode;
  steps: RouteStep[];
}

export function getOsrmProfile(mode: RoutingMode): string {
  return mode === "walking" ? "walking" : "driving";
}

export async function fetchRoute(
  from: UserLocation,
  to: { lat: number; lng: number },
  mode: RoutingMode,
): Promise<RouteData> {
  const response = await postJson("/api/route", {
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: to.lat,
    toLng: to.lng,
    mode,
  });
  const data = (await response.json()) as RouteData & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to fetch route");
  }

  return data;
}
