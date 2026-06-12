import { readCachedDetectedCountry } from "@/lib/detectedCountry";
import { ensurePostHog } from "@/lib/posthog.client";
import type { Organization, UserLocation } from "@/lib/types";

export type OrganizationEventProperties = {
  organization_id: string;
  organization_name: string;
  country: string;
  service_type: string;
};

/** Fire-and-forget named PostHog event (client-only). */
export function capturePostHogEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  void ensurePostHog()
    .then((posthog) => {
      if (!posthog) return;
      posthog.capture(event, properties);
    })
    .catch((err) => console.error("[capturePostHogEvent]", event, err));
}

export function organizationEventProperties(
  org: Organization,
): OrganizationEventProperties {
  return {
    organization_id: org.id,
    organization_name: org.name,
    country: org.country ?? "",
    service_type: org.category,
  };
}

export function formatSearchLocation(
  userLocation: UserLocation | null,
): string {
  if (!userLocation) return "";
  const cached = readCachedDetectedCountry();
  if (cached?.country) return cached.country;
  return `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
}

export function trackDirectionsClicked(org: Organization): void {
  capturePostHogEvent("directions_clicked", organizationEventProperties(org));
}

export function trackPhoneClicked(org: Organization): void {
  capturePostHogEvent("phone_clicked", organizationEventProperties(org));
}

export function trackWebsiteClicked(org: Organization): void {
  capturePostHogEvent("website_clicked", organizationEventProperties(org));
}

export function trackSearchPerformed(properties: {
  query: string;
  location: string;
  results_count: number;
}): void {
  capturePostHogEvent("search_performed", properties);
}

export function trackMapInteraction(properties: {
  interaction_type: "zoom" | "click";
  zoom_level?: number;
  lat?: number;
  lng?: number;
}): void {
  capturePostHogEvent("map_interaction", properties);
}

export function trackEmergencyOpened(): void {
  capturePostHogEvent("emergency_opened");
}
