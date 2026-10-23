import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { CONTENT_SECURITY_POLICY } from "../../config/contentSecurityPolicy.mjs";
import { mockNearbyApi, openMapWithOrgs, preferFullMode } from "./helpers";

// The only third-party host the browser may contact by itself is the OSM tile server.
const ALLOWED_THIRD_PARTY = /(^|\.)tile\.openstreetmap\.org$/i;

test.describe("Third-party browser requests", () => {
  test("the map flow contacts no host except our origin and the OSM tile server", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockNearbyApi(page);
    // Tiles are not needed to check who is contacted.
    await page.route(/tile\.openstreetmap\.org/, (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: Buffer.alloc(0) }),
    );

    const hosts = new Set<string>();
    page.on("request", (request) => {
      const { protocol, host, hostname } = new URL(request.url());
      if (protocol === "http:" || protocol === "https:") {
        if (host !== new URL(baseURL!).host) hosts.add(hostname);
      }
    });

    await openMapWithOrgs(page);

    const unexpected = [...hosts].filter((h) => !ALLOWED_THIRD_PARTY.test(h));
    expect(unexpected).toEqual([]);
  });

  test("country flags and marker icons are served from our own origin", async ({ page, request }) => {
    const review = {
      id: 1,
      name: "Test",
      country: "France",
      message: "Works",
      rating: 5,
      approved: true,
      created_at: "2026-01-01T00:00:00Z",
    };
    await page.route(/\/api\/reviews/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([review]) }),
    );

    const external: string[] = [];
    page.on("request", (r) => {
      if (/flagcdn|unpkg/i.test(r.url())) external.push(r.url());
    });

    await page.goto("/reviews");
    await expect(page.locator('img[src="/flags/fr.svg"]')).toBeVisible();
    expect(external).toEqual([]);

    for (const path of [
      "/flags/fr.svg",
      "/flags/ru.svg",
      "/leaflet/marker-icon.png",
      "/leaflet/marker-icon-2x.png",
      "/leaflet/marker-shadow.png",
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });

  test("the CSP allows no CDN, no Supabase host for the browser and no analytics host by default", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unpkg|flagcdn|supabase|posthog|umami/i);
    expect(CONTENT_SECURITY_POLICY).toContain("tile.openstreetmap.org");
  });
});

const GOOGLE_FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(tsx?|mjs|css|html)$/.test(entry)) out.push(full);
  }
  return out;
}

test.describe("Fonts are self-hosted", () => {
  test("no source file imports next/font/google or names a Google Fonts host", () => {
    const root = join(__dirname, "..", "..");
    const offenders: string[] = [];
    for (const dir of ["app", "components", "lib", "config"]) {
      for (const file of sourceFiles(join(root, dir))) {
        const text = readFileSync(file, "utf8");
        if (/next\/font\/google|@next\/font\/google/.test(text) || GOOGLE_FONT_HOSTS.test(text)) {
          offenders.push(file.replace(root, ""));
        }
      }
    }
    expect(offenders).toEqual([]);
    for (const file of ["next.config.mjs", join("public", "theme-init.js")]) {
      expect(readFileSync(join(root, file), "utf8")).not.toMatch(GOOGLE_FONT_HOSTS);
    }
  });

  test("pages load their fonts from our own origin and never contact Google Fonts", async ({ page, baseURL }) => {
    const googleRequests: string[] = [];
    const ownFonts: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (GOOGLE_FONT_HOSTS.test(url)) googleRequests.push(url);
      if (/\.woff2(\?|$)/.test(url) && new URL(url).origin === new URL(baseURL!).origin) ownFonts.push(url);
    });

    for (const path of ["/", "/about", "/privacy"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }

    expect(googleRequests).toEqual([]);
    expect(ownFonts.length).toBeGreaterThan(0);

    const html = await page.content();
    expect(html).not.toMatch(GOOGLE_FONT_HOSTS);
    // the combined families resolve to the self-hosted ones
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family).not.toMatch(/^"?DM Sans"?,/);
    expect(await page.evaluate(() => document.fonts.size)).toBeGreaterThan(0);
  });
});
