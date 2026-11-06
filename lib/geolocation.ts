import type { UserLocation } from "@/lib/types";

export interface TrackedUserLocation extends UserLocation {
  accuracy?: number;
}

export type GeolocationWatchCallback = (location: TrackedUserLocation) => void;

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

/**
 * Continuous tracking. Not used by default (the position is read once with getCurrentPosition,
 * see lib/locationRequest.ts); turn it on only for a feature that needs live movement and clear
 * the watch with the returned cleanup as soon as it is done.
 */
export function watchUserLocation(
  onUpdate: GeolocationWatchCallback,
  onError?: (error: GeolocationPositionError) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError?.({
      code: 2,
      message: "Geolocation unavailable",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (err) => onError?.(err),
    WATCH_OPTIONS,
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/** One-shot high-accuracy position (used when starting map before watch kicks in). */
export function getCurrentUserLocation(): Promise<TrackedUserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      (err) => reject(err),
      WATCH_OPTIONS,
    );
  });
}
