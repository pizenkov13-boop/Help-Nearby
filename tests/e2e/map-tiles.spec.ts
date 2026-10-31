import { test, expect } from "./fixtures";
import {
  getMapTileConfig,
  isValidTileUrl,
  DEFAULT_MAP_TILES_URL,
} from "@/lib/mapTiles";
import {
  grantNycLocation,
  mockNearbyApi,
  openMapWithOrgs,
  preferFullMode,
} from "./helpers";

test.describe("Map tile config (unit)", () => {
  test("defaults to OpenStreetMap and only accepts https tile templates", () => {
    expect(getMapTileConfig().url).toBe(DEFAULT_MAP_TILES_URL);
    expect(getMapTileConfig().maxZoom).toBe(19);
    expect(isValidTileUrl("https://tiles.example/{z}/{x}/{y}.png?key=k")).toBe(true);
    expect(isValidTileUrl("http://tiles.example/{z}/{x}/{y}.png")).toBe(false);
    expect(isValidTileUrl("https://tiles.example/static.png")).toBe(false);
  });
});

test.describe("Map tiles", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockNearbyApi(page);
    await grantNycLocation(page);
  });

  test("uses OpenStreetMap tiles, never carto.com, and shows attribution", async ({ page }) => {
    const tileHosts: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (request.resourceType() === "image" || /carto/i.test(url.hostname)) {
        tileHosts.push(url.hostname);
      }
    });
    // Do not hit the real tile servers from tests; answer with a 1x1 PNG.
    await page.route(/tile\.openstreetmap\.org/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        ),
      }),
    );

    await openMapWithOrgs(page);

    await expect
      .poll(() => tileHosts.some((h) => h.endsWith("tile.openstreetmap.org")), {
        timeout: 20_000,
      })
      .toBe(true);
    expect(tileHosts.some((h) => /carto/i.test(h))).toBe(false);

    const attribution = page.locator(".leaflet-control-attribution");
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText("OpenStreetMap");
    await expect(attribution.getByRole("link", { name: "OpenStreetMap" })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );
  });

  test("dark theme filters the tile pane only", async ({ page }) => {
    await page.route(/tile\.openstreetmap\.org/, (route) =>
      route.fulfill({ status: 204, body: "" }),
    );
    await openMapWithOrgs(page);

    await page.evaluate(() => document.documentElement.classList.add("dark"));

    const filter = (selector: string) =>
      page.locator(selector).first().evaluate((el) => getComputedStyle(el).filter);

    await expect.poll(() => filter(".leaflet-tile-pane")).toContain("invert");
    expect(await filter(".leaflet-marker-pane")).toBe("none");
    expect(await filter(".leaflet-popup-pane")).toBe("none");

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect.poll(() => filter(".leaflet-tile-pane")).toBe("none");
  });
});
