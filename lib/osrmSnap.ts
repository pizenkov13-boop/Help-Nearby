const USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";
const OSRM_NEAREST = "https://router.project-osrm.org/nearest/v1/walking";

interface OsrmNearestResponse {
  code?: string;
  waypoints?: { location?: [number, number] }[];
}

export interface SnappedPoint {
  lng: number;
  lat: number;
}

/** Snap a point to the nearest walkable road (OSRM walking network). */
export async function snapToNearestWalkingRoad(
  lng: number,
  lat: number,
): Promise<SnappedPoint> {
  const url = `${OSRM_NEAREST}/${lng},${lat}?number=1`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.warn("[osrmSnap] nearest HTTP", response.status, { lng, lat });
      return { lng, lat };
    }

    const data = (await response.json()) as OsrmNearestResponse;
    const location = data.waypoints?.[0]?.location;

    if (
      data.code === "Ok" &&
      Array.isArray(location) &&
      location.length >= 2 &&
      Number.isFinite(location[0]) &&
      Number.isFinite(location[1])
    ) {
      return { lng: location[0], lat: location[1] };
    }
  } catch (error) {
    console.warn("[osrmSnap] nearest failed:", error);
  }

  return { lng, lat };
}
