import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "./fixtures";
import { CONTENT_SECURITY_POLICY } from "../../config/contentSecurityPolicy.mjs";
import { stripQueryAndHash } from "@/lib/analyticsUrl";
import { preferFullMode } from "./helpers";

const root = join(__dirname, "..", "..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(tsx?|mjs|js|css|html)$/.test(entry)) out.push(full);
  }
  return out;
}

const directive = (csp: string, name: string) =>
  csp.split("; ").find((d) => d.startsWith(`${name} `))!.split(" ").slice(1);

test.describe("Analytics: Vercel Web Analytics only", () => {
  test("pages make no analytics request to any other origin and set no cookie or analytics storage", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const analyticsRequests: string[] = [];
    const foreign: string[] = [];
    const cspViolations: string[] = [];
    // A first visit without the cache-version key reloads the page once; skip that for a stable run.
    await preferFullMode(page);

    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/_vercel/")) analyticsRequests.push(url);
      if (/posthog|umami|google-analytics|googletagmanager|vercel-scripts|plausible|hotjar|mixpanel/i.test(url)) {
        foreign.push(url);
      }
    });
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) cspViolations.push(message.text());
    });

    for (const path of ["/", "/about", "/privacy"]) {
      // The analytics script is injected after hydration: wait for its request instead of "network idle".
      const scriptRequested = page.waitForRequest(/\/_vercel\/insights\/script\.js/);
      await page.goto(path);
      await scriptRequested;
      await page.evaluate(() => document.fonts.ready);
    }

    // The Vercel script is requested from our own origin (it only exists on Vercel; locally it is a 404).
    expect(analyticsRequests.length).toBeGreaterThan(0);
    for (const url of analyticsRequests) {
      expect(new URL(url).origin, url).toBe(origin);
      expect(new URL(url).pathname, url).toMatch(/^\/_vercel\/insights\//);
    }
    expect(foreign).toEqual([]);
    expect(cspViolations).toEqual([]);

    // cookieless: nothing is stored by analytics
    expect(await page.context().cookies()).toEqual([]);
    const storageKeys = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    expect(storageKeys.filter((key) => /^(va|vercel|_va|ph_|umami)/i.test(key))).toEqual([]);
  });

  test("the injected script is the same-origin /_vercel/insights/script.js", async ({ page, baseURL }) => {
    await preferFullMode(page);
    const scriptRequested = page.waitForRequest(/\/_vercel\/insights\/script\.js/);
    await page.goto("/");
    await scriptRequested;
    const sources = await page.evaluate(() =>
      [...document.querySelectorAll("script[src]")].map((s) => (s as HTMLScriptElement).src),
    );
    const insights = sources.filter((src) => src.includes("/_vercel/insights/"));
    expect(insights).toEqual([`${new URL(baseURL!).origin}/_vercel/insights/script.js`]);
    expect(sources.some((src) => /vercel-scripts\.com/.test(src))).toBe(false);
  });

  test("the CSP already allows the same-origin script and its requests, and no external host", () => {
    const csp = CONTENT_SECURITY_POLICY;
    expect(directive(csp, "script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directive(csp, "script-src-elem")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    expect(csp).not.toMatch(/vercel|umami|posthog|google|gateway|cloud\./i);
  });

  test("the service worker never caches /_vercel/ requests", () => {
    const sw = readFileSync(join(root, "public", "sw.js"), "utf8");
    expect(sw).toMatch(/startsWith\("\/_vercel\/"\)/);
    expect(sw).toMatch(/isPlatformRequest\(url\)\) return true/);
  });

  test("source: the only analytics is @vercel/analytics; no Umami, PostHog or other tracker is left", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };
    const dependencies = Object.keys(pkg.dependencies);
    expect(dependencies).toContain("@vercel/analytics");
    expect(
      dependencies.filter((name) => /posthog|umami|gtag|plausible|hotjar|mixpanel|segment|sentry/i.test(name)),
    ).toEqual([]);

    const offenders: string[] = [];
    for (const dir of ["app", "components", "lib", "config", "public"]) {
      for (const file of sourceFiles(join(root, dir))) {
        if (/[\\/]public[\\/]flags[\\/]/.test(file)) continue;
        const text = readFileSync(file, "utf8");
        if (/umami|posthog|googletagmanager|google-analytics|NEXT_PUBLIC_UMAMI/i.test(text)) {
          offenders.push(file.replace(root, ""));
        }
      }
    }
    expect(offenders).toEqual([]);

    const layout = readFileSync(join(root, "app", "layout.tsx"), "utf8");
    expect(layout).toContain("<VercelAnalytics />");
    const wrapper = readFileSync(join(root, "components", "providers", "VercelAnalytics.tsx"), "utf8");
    expect(wrapper).toContain('from "@vercel/analytics/next"');
    expect(wrapper).toContain('mode="production"');
  });

  test("page addresses are sent without query string or hash", () => {
    expect(stripQueryAndHash("https://help-nearby.org/?find=1&q=food#map")).toBe("https://help-nearby.org/");
    expect(stripQueryAndHash("https://help-nearby.org/org/crf-x?lat=1&lng=2")).toBe(
      "https://help-nearby.org/org/crf-x",
    );
    expect(stripQueryAndHash("https://help-nearby.org/privacy")).toBe("https://help-nearby.org/privacy");
    expect(stripQueryAndHash("/relative/path?x=1#y")).toBe("/relative/path");
  });
});
