import type { UserLocation } from "@/lib/types";

/** The last position the person shared (or typed) in this tab. Kept in memory only, never stored. */
let lastPosition: UserLocation | null = null;

export function getLastPosition() {
  return lastPosition;
}

export function rememberPosition(position: UserLocation) {
  lastPosition = position;
}

/** Whether the browser already lets this site read the location (so no prompt will appear). */
export async function isLocationGranted(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions) return false;
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state === "granted";
  } catch {
    return false;
  }
}
