import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY,
} from "../../config/contentSecurityPolicy.mjs";
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

  test.describe("CSP for the Umami tracker", () => {
    const directive = (csp: string, name: string) =>
      csp.split("; ").find((d) => d.startsWith(`${name} `))!.split(" ").slice(1);
    const remoteHosts = (sources: string[]) =>
      sources.filter((source) => source.startsWith("https://") || source.startsWith("wss://"));

    const cloud = {
      NEXT_PUBLIC_UMAMI_SRC: "https://cloud.umami.is/script.js",
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "00000000-0000-0000-0000-000000000000",
    };

    test("Umami Cloud: connect-src gets exactly cloud.umami.is and gateway.umami.is", () => {
      const csp = buildContentSecurityPolicy(cloud);
      expect(directive(csp, "connect-src")).toEqual([
        "'self'",
        "https://cloud.umami.is",
        "https://gateway.umami.is",
      ]);
      expect(remoteHosts(directive(csp, "connect-src"))).toHaveLength(2);
    });

    test("Umami Cloud: the script is allowed from cloud.umami.is only; no other directive names Umami", () => {
      const csp = buildContentSecurityPolicy(cloud);
      for (const name of ["script-src", "script-src-elem"]) {
        expect(remoteHosts(directive(csp, name)), name).toEqual(["https://cloud.umami.is"]);
      }
      expect(csp.match(/gateway\.umami\.is/g)).toHaveLength(1); // only in connect-src
      for (const name of ["default-src", "img-src", "style-src", "font-src", "frame-ancestors", "object-src"]) {
        expect(directive(csp, name).join(" "), name).not.toMatch(/umami/);
      }
    });

    test("without the variables there is no Umami host at all (also when only one is set)", () => {
      for (const env of [
        {},
        { NEXT_PUBLIC_UMAMI_SRC: cloud.NEXT_PUBLIC_UMAMI_SRC },
        { NEXT_PUBLIC_UMAMI_WEBSITE_ID: cloud.NEXT_PUBLIC_UMAMI_WEBSITE_ID },
      ]) {
        const csp = buildContentSecurityPolicy(env);
        expect(csp).not.toMatch(/umami/i);
        expect(directive(csp, "connect-src")).toEqual(["'self'"]);
      }
      expect(CONTENT_SECURITY_POLICY).not.toMatch(/umami/i);
    });

    test("a self-hosted Umami gets its own origin only: no gateway, no other host", () => {
      const csp = buildContentSecurityPolicy({
        NEXT_PUBLIC_UMAMI_SRC: "https://stats.example.org/script.js",
        NEXT_PUBLIC_UMAMI_WEBSITE_ID: "abc",
      });
      expect(directive(csp, "connect-src")).toEqual(["'self'", "https://stats.example.org"]);
      expect(remoteHosts(directive(csp, "script-src"))).toEqual(["https://stats.example.org"]);
      expect(csp).not.toMatch(/gateway\.umami\.is|cloud\.umami\.is/);
    });

    test("a non-https or malformed script URL adds nothing", () => {
      for (const src of ["http://cloud.umami.is/script.js", "not a url", "//cloud.umami.is/script.js"]) {
        const csp = buildContentSecurityPolicy({
          NEXT_PUBLIC_UMAMI_SRC: src,
          NEXT_PUBLIC_UMAMI_WEBSITE_ID: "abc",
        });
        expect(csp, src).not.toMatch(/umami/i);
      }
    });

    test("the rest of the policy is unchanged by analytics", () => {
      const base = buildContentSecurityPolicy({});
      const withCloud = buildContentSecurityPolicy(cloud);
      const strip = (csp: string) =>
        csp
          .split("; ")
          .filter((d) => !/^(script-src|script-src-elem|connect-src) /.test(d))
          .join("; ");
      expect(strip(withCloud)).toBe(strip(base));
    });
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
