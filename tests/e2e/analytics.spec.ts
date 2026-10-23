import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { CONTENT_SECURITY_POLICY } from "../../config/contentSecurityPolicy.mjs";
import { trackEvent, type AnalyticsEvent } from "@/lib/umami.client";

const EVENTS: AnalyticsEvent[] = [
  "search_performed",
  "map_opened",
  "directions_requested",
  "organization_card_opened",
];

test.describe("Analytics (Umami)", () => {
  test("without the env vars no analytics script is loaded and no analytics request is made", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on("request", (req) => {
      if (/posthog|umami/i.test(req.url())) analyticsRequests.push(req.url());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(analyticsRequests).toEqual([]);
    await expect(page.locator("script[data-website-id]")).toHaveCount(0);
    expect(await page.evaluate(() => "umami" in window)).toBe(false);
  });

  test("the CSP has no PostHog entries and no analytics host while Umami is not configured", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/posthog/i);
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/umami/i);
  });

  test("events are sent by name only, never with a payload", () => {
    const calls: unknown[][] = [];
    const g = globalThis as unknown as { window?: unknown };
    const previous = g.window;
    g.window = { umami: { track: (...args: unknown[]) => calls.push(args) } };
    try {
      for (const event of EVENTS) trackEvent(event);
    } finally {
      g.window = previous;
    }
    expect(calls).toEqual(EVENTS.map((event) => [event]));
  });

  test("trackEvent is a no-op when the tracker is missing or throws", () => {
    const g = globalThis as unknown as { window?: unknown };
    const previous = g.window;
    try {
      g.window = {};
      expect(() => trackEvent("map_opened")).not.toThrow();
      g.window = {
        umami: {
          track: () => {
            throw new Error("blocked");
          },
        },
      };
      expect(() => trackEvent("map_opened")).not.toThrow();
    } finally {
      g.window = previous;
    }
  });

  test("source: no PostHog, no identify, no cookies or storage in the analytics code", () => {
    const root = join(__dirname, "..", "..");
    const client = readFileSync(join(root, "lib", "umami.client.ts"), "utf8");
    const script = readFileSync(join(root, "components", "providers", "UmamiScript.tsx"), "utf8");
    const pkg = readFileSync(join(root, "package.json"), "utf8");

    expect(pkg).not.toMatch(/posthog/i);
    const code = (source: string) =>
      source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const source of [client, script]) {
      expect(source).not.toMatch(/posthog/i);
      expect(code(source)).not.toMatch(/identify|localStorage|sessionStorage|document\.cookie/);
    }
    expect(script).toContain('data-do-not-track="true"');
    expect(script).toContain('data-exclude-search="true"');
  });
});
