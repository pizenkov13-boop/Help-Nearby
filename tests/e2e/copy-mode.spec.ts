import http from "node:http";
import { test, expect } from "./fixtures";

/**
 * Copy mode: a site deployed from the template, built with NEXT_PUBLIC_SITE_URL on another domain.
 * Run with `npm run test:e2e:copy` (own build, own config). Skipped in the normal run.
 */
test.skip(process.env.E2E_COPY_MODE !== "1", "needs a copy-mode build (npm run test:e2e:copy)");

const COPY_ORIGIN = "https://copy.example.org";

test.describe("copy mode", () => {
  test("footer has no main-site branding and carries the Powered by HelpNearby credit", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const text = await footer.innerText();
    expect(text).not.toMatch(/help\.nearby1|helpnearby_org/i);
    expect(text).not.toMatch(/kindness/i);
    expect(text).not.toMatch(/sustainable development goals/i);
    expect(text).not.toMatch(/hello@help-nearby\.org/i);

    const hrefs = await footer.locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
    expect(hrefs.join(" ")).not.toMatch(/t\.me\/helpnearby_org|kindness|sdgs\.un\.org|hello@help-nearby\.org/i);
    expect(await footer.locator("img[src*='sdg']").count()).toBe(0);

    const credit = footer.getByTestId("footer-powered-by");
    await expect(credit).toContainText("Powered by");
    await expect(credit.getByRole("link", { name: "HelpNearby" })).toHaveAttribute(
      "href",
      "https://www.help-nearby.org/",
    );
  });

  test("submit and reviews are not available", async ({ request }) => {
    expect((await request.get("/submit")).status()).toBe(404);
    expect((await request.get("/reviews")).status()).toBe(404);
    expect((await request.post("/api/submit", { data: {} })).status()).toBe(404);
  });

  test("privacy page opens and does not name the main site's operator", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);

    const main = page.locator("main");
    await expect(main).toContainText(/location/i);
    const text = await main.innerText();
    expect(text).not.toMatch(/help-nearby\.org|hello@|izenkin|pavel|kindness/i);
    expect(await main.locator("a[href*='help-nearby.org']").count()).toBe(0);
  });

  test("sitemap and robots point only at the copy's own address", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc.startsWith(`${COPY_ORIGIN}/`), `${loc} is not on the copy`).toBe(true);
    }
    expect(locs).toContain(`${COPY_ORIGIN}/privacy`);
    for (const closed of ["/submit", "/reviews", "/recent", "/why-it-matters"]) {
      expect(locs).not.toContain(`${COPY_ORIGIN}${closed}`);
    }

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain(`Sitemap: ${COPY_ORIGIN}/sitemap.xml`);
    expect(robots).not.toContain("help-nearby.org");
  });
});

/**
 * A fresh copy has an empty database and no UN-source keys, and here Overpass is unreachable
 * (see playwright.copy.config.ts). The search must still return OSM data, through the Nominatim
 * fallback, and must say "unavailable" (an error status) instead of an empty 200 when nothing answers.
 */
test.describe("copy mode search without external sources", () => {
  test.describe.configure({ mode: "serial" });

  let stub: http.Server;
  let stubOnline = true;

  test.beforeAll(async () => {
    stub = http.createServer((req, res) => {
      if (!stubOnline) {
        res.writeHead(503).end("down");
        return;
      }
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const [west, north, east, south] = (url.searchParams.get("viewbox") ?? "0,0,0,0").split(",").map(Number);
      const lat = ((north ?? 0) + (south ?? 0)) / 2;
      const lon = ((west ?? 0) + (east ?? 0)) / 2;
      const term = url.searchParams.get("q") ?? "";
      const items =
        term === "pharmacy"
          ? [0, 1, 2].map((i) => ({
              osm_type: "node",
              osm_id: 1000 + i,
              lat: String(lat + i * 0.001),
              lon: String(lon + i * 0.001),
              name: `Stub pharmacy ${i}`,
              category: "amenity",
              type: "pharmacy",
              extratags: {},
            }))
          : [];
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(items));
    });
    await new Promise<void>((resolve) => stub.listen(3199, "127.0.0.1", resolve));
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => stub.close(() => resolve()));
  });

  const PLACES = [
    { name: "large city (Warsaw)", lat: 52.2297, lng: 21.0122 },
    { name: "mid-size city (Lyon)", lat: 45.764, lng: 4.8357 },
    { name: "small city (Bergen)", lat: 60.3913, lng: 5.3221 },
  ];

  for (const place of PLACES) {
    test(`${place.name}: OSM results come back although Overpass and the database are down`, async ({ request }) => {
      stubOnline = true;
      const response = await request.post("/api/nearby", {
        data: { lat: place.lat, lng: place.lng, radius: 5000 },
        timeout: 60_000,
      });
      expect(response.status()).toBe(200);
      const organizations = (await response.json()) as { name: string; osmKind?: string }[];
      expect(Array.isArray(organizations)).toBe(true);
      expect(organizations.length).toBeGreaterThan(0);
      expect(organizations.every((org) => org.osmKind === "pharmacy")).toBe(true);
    });
  }

  test("empty database and no UN-source keys do not break the other search routes", async ({ request }) => {
    const started = Date.now();
    const catalog = await request.post("/api/organizations", { data: { lat: 52.2297, lng: 21.0122, radius: 5000 } });
    const directory = await request.post("/api/verified-nearby", {
      data: { country: "Poland", countryCode: "PL", stage: "directory" },
      timeout: 30_000,
    });
    expect(Date.now() - started).toBeLessThan(30_000);
    // Either an answer or an explicit error status, never a hang or a crash.
    expect(catalog.status()).toBeLessThan(600);
    expect(directory.status()).toBeLessThan(600);
    expect(catalog.headers()["content-type"]).toContain("application/json");
    expect(directory.headers()["content-type"]).toContain("application/json");
  });

  test("when every OSM source is down the API says so with an error status, not an empty 200", async ({ request }) => {
    stubOnline = false;
    const response = await request.post("/api/nearby", {
      data: { lat: 40.4168, lng: -3.7038, radius: 5000 },
      timeout: 60_000,
    });
    expect([502, 504]).toContain(response.status());
    expect(await response.json()).toMatchObject({ error: true });
  });
});
