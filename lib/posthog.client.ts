const DEFAULT_HOST = "https://us.i.posthog.com";

type PostHogLike = {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

let posthogPromise: Promise<PostHogLike | null> | null = null;
let didInit = false;

export function getPostHogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

/** Production always; development only when NEXT_PUBLIC_POSTHOG_DEBUG=true. */
export function isPostHogEnabled(): boolean {
  if (!getPostHogKey()) return false;
  if (process.env.NODE_ENV === "production") return true;
  return process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true";
}

export function capturePageView(posthog: PostHogLike): void {
  posthog.capture("$pageview", { $current_url: window.location.href });
}

function getInitOptions(loaded?: (posthog: PostHogLike) => void) {
  return {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_HOST,
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    disable_surveys: true,
    advanced_disable_decide: true,
    loaded,
  };
}

/** Single init point shared by Analytics provider and event helpers. */
export function ensurePostHog(): Promise<PostHogLike | null> {
  if (typeof window === "undefined" || !isPostHogEnabled()) {
    return Promise.resolve(null);
  }

  const key = getPostHogKey()!;

  if (!posthogPromise) {
    posthogPromise = import("posthog-js").then(({ default: posthog }) => {
      const client = posthog as PostHogLike;
      if (!didInit) {
        didInit = true;
        client.init(
          key,
          getInitOptions((ph) => {
            ph.capture("test_event");
            capturePageView(ph);
          }),
        );
      }
      return client;
    });
  }

  return posthogPromise;
}
