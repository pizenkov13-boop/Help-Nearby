/**
 * Privacy-first analytics (Umami). Only pageviews (automatic) and the named events below.
 * Events carry NO data: no coordinates, search text, country, organization names or any user input.
 * No identify(), no cookies, no localStorage ids.
 */
export type AnalyticsEvent =
  | "search_performed"
  | "map_opened"
  | "directions_requested"
  | "organization_card_opened";

interface UmamiTracker {
  track: (event: string) => void;
}

/** The script is injected only when NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SRC are both set. */
export function isUmamiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() &&
      process.env.NEXT_PUBLIC_UMAMI_SRC?.trim().startsWith("https://"),
  );
}

/** Fire-and-forget named event without payload. A no-op when Umami is not loaded. */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  try {
    umami?.track(event);
  } catch {
    // analytics must never break the page
  }
}
