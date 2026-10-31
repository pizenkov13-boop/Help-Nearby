import type { TrackedUserLocation } from "@/lib/geolocation";

export type LocationIssue = "denied" | "unavailable" | "timeout" | "in-app";

/** How long to wait for the browser to answer before telling the person what to do instead. */
export const LOCATION_WATCHDOG_MS = 12_000;

/** Messengers and social apps open links in an embedded browser that often never shows a location prompt. */
const IN_APP_BROWSER =
  /Instagram|FBAN|FBAV|FB_IAB|Telegram|TelegramBot|Snapchat|TikTok|MicroMessenger|; wv\)|\bLine\//i;

export function isInAppBrowser(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator === "undefined" ? "" : navigator.userAgent);
  return IN_APP_BROWSER.test(ua);
}

interface RequestHandlers {
  onPosition: (location: TrackedUserLocation) => void;
  /** Called at most once; the request itself stays pending, so a late answer still reaches onPosition. */
  onIssue: (issue: LocationIssue) => void;
}

/**
 * One explicit location request (call it only from a tap). It never leaves the page waiting:
 * an error, a missing API or a request nobody answers within LOCATION_WATCHDOG_MS all end in onIssue,
 * and a late "allow" is still accepted.
 */
export function requestPosition({ onPosition, onIssue }: RequestHandlers): void {
  let issueReported = false;
  const reportIssue = (issue: LocationIssue) => {
    if (issueReported) return;
    issueReported = true;
    onIssue(issue);
  };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    reportIssue("in-app");
    return;
  }

  const watchdog = setTimeout(() => {
    reportIssue(isInAppBrowser() ? "in-app" : "timeout");
  }, LOCATION_WATCHDOG_MS);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      clearTimeout(watchdog);
      onPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      clearTimeout(watchdog);
      if (error.code === error.PERMISSION_DENIED) {
        reportIssue(isInAppBrowser() ? "in-app" : "denied");
      } else if (error.code === error.TIMEOUT) {
        reportIssue(isInAppBrowser() ? "in-app" : "timeout");
      } else {
        reportIssue(isInAppBrowser() ? "in-app" : "unavailable");
      }
    },
    // A city-level fix is enough for a 5 km search, and it answers much faster than GPS on phones.
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
  );
}
