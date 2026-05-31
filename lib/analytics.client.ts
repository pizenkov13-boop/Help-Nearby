import type { Organization } from "@/lib/types";

export type OrganizationEventProperties = {
  organization_name: string;
  city: string;
  country: string;
  category: string;
};

function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

let posthogPromise: Promise<PostHogClient | null> | null = null;

function loadPostHog(): Promise<PostHogClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (process.env.NODE_ENV !== "production") return Promise.resolve(null);
  const key = getPostHogKey();
  if (!key) return Promise.resolve(null);

  if (!posthogPromise) {
    posthogPromise = import("posthog-js").then(
      ({ default: posthog }) => posthog as PostHogClient,
    );
  }
  return posthogPromise;
}

/** Fire-and-forget named PostHog event (client-only). */
export function capturePostHogEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  void loadPostHog()
    ?.then((posthog) => {
      if (!posthog) return;
      posthog.capture(event, properties);
    })
    .catch((err) => console.error("[capturePostHogEvent]", event, err));
}

export function organizationEventProperties(
  org: Organization,
): OrganizationEventProperties {
  return {
    organization_name: org.name,
    city: org.city ?? "",
    country: org.country ?? "",
    category: org.category,
  };
}

export function trackCallOrganization(org: Organization): void {
  capturePostHogEvent("call_organization", organizationEventProperties(org));
}

export function trackGetDirections(org: Organization): void {
  capturePostHogEvent("get_directions", organizationEventProperties(org));
}

export function trackEmergencyOpened(): void {
  capturePostHogEvent("emergency_opened");
}
