import type { Page, Route } from "@playwright/test";
import { test, expect } from "./fixtures";
import { nearbyAreaKey } from "@/lib/nearbyCache";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import type { Organization } from "@/lib/types";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  NYC_GEO,
  orgCards,
  preferFullMode,
} from "./helpers";

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

const CACHE_KEY = "help-nearby-orgs-cache";
const base = MOCK_NEARBY_ORGS[0] as Organization;

async function setup(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await preferFullMode(page);
  await mockNearbyApi(page);
  await grantNycLocation(page);
}

async function openPanel(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
}

test.describe("Which place the results are for", () => {
  test("the bar names the place and the position goes in the POST body", async ({ page }) => {
    await setup(page);
    const bodies: { url: string; body: Record<string, unknown> }[] = [];
    await page.route(/\/api\/geocode\/reverse/, (route) => {
      bodies.push({ url: route.request().url(), body: route.request().postDataJSON() });
      return json(route, { country: "United States", countryCode: "US", place: "Midtown, New York" });
    });

    await openPanel(page);
    await expect(page.getByTestId("place-label")).toHaveText("Results near: Midtown, New York");
    await expect(page.getByTestId("change-place")).toBeVisible();

    expect(bodies.length).toBeGreaterThan(0);
    for (const { url, body } of bodies) {
      expect(url).not.toMatch(/lat=|lng=|lon=/);
      expect(typeof body.lat).toBe("number");
    }
    // The search asks for the label in the page language.
    expect(bodies.some(({ body }) => body.lang === "en")).toBe(true);
  });

  test("a reverse geocode that never answers delays neither the panel nor the results", async ({ page }) => {
    await setup(page);
    await page.route(/\/api\/geocode\/reverse/, () => new Promise(() => {}));
    const started = Date.now();
    await openPanel(page);
    await expect(orgCards(page).first()).toBeVisible({ timeout: 15_000 });
    expect(Date.now() - started).toBeLessThan(12_000);
    await expect(page.getByTestId("place-label")).toHaveText("Results near: your current location");
  });

  test("without a place label it says 'your current location'", async ({ page }) => {
    await setup(page);
    await openPanel(page);
    await expect(page.getByTestId("place-label")).toHaveText("Results near: your current location");
  });

  test("Change place searches a typed city and the bar follows", async ({ page }) => {
    await setup(page);
    await page.route(/\/api\/geocode(?!\/reverse)/, (route) =>
      json(route, {
        results: [{ name: "Nice, France", lat: 43.7102, lng: 7.262, country: "France", countryCode: "FR" }],
      }),
    );
    await openPanel(page);

    await page.getByTestId("change-place").click();
    await expect(page.getByTestId("change-place-form")).toBeVisible();
    await page.locator("#place-input").fill("Nice");
    await page.getByTestId("change-place-form").getByRole("button", { name: "Search" }).click();

    await expect(page.getByTestId("place-label")).toHaveText("Results near: Nice, France");
    // The form folds away once the place changed.
    await expect(page.getByTestId("change-place-form")).toHaveCount(0);
  });

  test("a coarse device position is called out", async ({ page }) => {
    await setup(page);
    await page.context().setGeolocation({ ...NYC_GEO, accuracy: 60_000 });
    await openPanel(page);
    await expect(page.getByTestId("place-approx")).toContainText("about 60 km");
  });

  test("a precise position has no warning", async ({ page }) => {
    await setup(page);
    await page.context().setGeolocation({ ...NYC_GEO, accuracy: 25 });
    await openPanel(page);
    await expect(page.getByTestId("place-label")).toBeVisible();
    await expect(page.getByTestId("place-approx")).toHaveCount(0);
  });
});

test.describe("Remembered results", () => {
  const entry = (lat: number, lng: number, ageMs: number) => ({
    timestamp: Date.now() - ageMs,
    area: nearbyAreaKey(lat, lng, false),
    organizations: [{ ...base, id: "cached-1", slug: "cached-1", name: "Cached Only Org" }],
    searchRadiusMeters: 5000,
    searchMode: "within",
    canExpand: false,
    nearestFallbackKm: null,
  });

  async function seedAndOpen(page: Page, payload: unknown) {
    await setup(page);
    // Nothing answers, so only the remembered list could ever appear.
    for (const pattern of [/\/api\/nearby/, /\/api\/organizations/, /\/api\/verified-nearby/]) {
      await page.route(pattern, () => new Promise(() => {}));
    }
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key as string, value as string),
      [CACHE_KEY, JSON.stringify(payload)],
    );
    await openPanel(page);
  }

  test("a fresh entry for the same area is used (control)", async ({ page }) => {
    await seedAndOpen(page, entry(NYC_GEO.latitude, NYC_GEO.longitude, 5 * 60_000));
    await expect(orgCards(page).filter({ hasText: "Cached Only Org" })).toBeVisible({ timeout: 10_000 });
  });

  test("an entry older than 30 minutes is not used and is deleted when the page opens", async ({ page }) => {
    await seedAndOpen(page, entry(NYC_GEO.latitude, NYC_GEO.longitude, 31 * 60_000));
    await page.waitForTimeout(2_000);
    await expect(page.getByText("Cached Only Org")).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), CACHE_KEY)).toBeNull();
  });

  test("an entry for another place (Warsaw) is never shown for this position", async ({ page }) => {
    await seedAndOpen(page, entry(52.2297, 21.0122, 5 * 60_000));
    await page.waitForTimeout(2_000);
    await expect(page.getByText("Cached Only Org")).toHaveCount(0);
  });
});

test.describe("Empty and failed loads", () => {
  test("an empty category says so and offers to expand the search, without new requests", async ({ page }) => {
    await setup(page);
    await openPanel(page);
    await expect(orgCards(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("loading-nearby")).toHaveCount(0, { timeout: 30_000 });

    const requests: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(nearby|organizations|verified-nearby)/.test(request.url())) requests.push(request.url());
    });

    const aside = page.locator("aside");
    await aside.getByRole("button", { name: "Clothing", exact: true }).click();
    await expect(page.getByText("No organizations here yet. Expand the search.")).toBeVisible();
    await expect(page.getByTestId("empty-expand")).toBeVisible();
    await expect(orgCards(page)).toHaveCount(0);

    await aside.getByRole("button", { name: "Food", exact: true }).click();
    await expect(orgCards(page).filter({ hasText: "E2E Test Food Bank" })).toBeVisible();
    await expect(orgCards(page).filter({ hasText: "E2E Test Shelter" })).toHaveCount(0);
    await aside.getByRole("button", { name: "All categories" }).click();
    await expect(orgCards(page)).toHaveCount(MOCK_NEARBY_ORGS.length);

    // Switching tabs only filters what is already loaded.
    expect(requests).toEqual([]);
  });

  test("every source failing shows 'could not load' with a retry that works", async ({ page }) => {
    await setup(page);
    let healthy = false;
    await page.route(/\/api\/nearby/, (route) => (healthy ? json(route, MOCK_NEARBY_ORGS) : json(route, { error: true }, 503)));
    await page.route(/\/api\/organizations/, (route) => (healthy ? json(route, MOCK_NEARBY_ORGS) : json(route, { error: true }, 503)));
    await openPanel(page);

    await expect(page.getByText("Couldn't load organizations.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("load-retry")).toBeVisible();

    healthy = true;
    await page.getByTestId("load-retry").click();
    await expect(orgCards(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Couldn't load organizations.")).toHaveCount(0);
  });

  test("database down: OpenStreetMap results are shown and the page says the verified catalog is unavailable", async ({ page }) => {
    await setup(page);
    await page.route(/\/api\/organizations/, (route) => json(route, { error: true, reason: "network" }, 503));
    await openPanel(page);

    await expect(orgCards(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("catalog-unavailable")).toHaveText(
      "The verified catalog is temporarily unavailable — showing OpenStreetMap results only",
      { timeout: 30_000 },
    );
    await expect(page.getByText("Couldn't load organizations.")).toHaveCount(0);
  });

  test("OSM down: the verified catalog is shown and the page says OpenStreetMap is unavailable", async ({ page }) => {
    await setup(page);
    await page.route(/\/api\/nearby/, (route) => json(route, { error: true }, 504));
    await openPanel(page);

    await expect(orgCards(page).filter({ hasText: "E2E Test Food Bank" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("osm-unavailable")).toHaveText(
      "OpenStreetMap is temporarily unavailable — showing verified organizations only",
      { timeout: 30_000 },
    );
    await expect(page.getByText("Couldn't load organizations.")).toHaveCount(0);
  });
});

test.describe("Map and list agree", () => {
  const markers = (page: Page) => page.locator(".leaflet-marker-icon.custom-marker");

  test("one marker per card, for every category, search text and Open now", async ({ page }) => {
    await setup(page);
    await openPanel(page);
    await expect(orgCards(page)).toHaveCount(MOCK_NEARBY_ORGS.length, { timeout: 30_000 });
    await expect.poll(() => markers(page).count(), { timeout: 15_000 }).toBe(MOCK_NEARBY_ORGS.length);

    const aside = page.locator("aside");
    await aside.getByRole("button", { name: "Food", exact: true }).click();
    await expect(orgCards(page)).toHaveCount(1);
    await expect.poll(() => markers(page).count(), { timeout: 15_000 }).toBe(1);

    await aside.getByRole("button", { name: "All categories" }).click();
    await page.locator("#org-search").fill("E2E Test Shelter");
    await expect(orgCards(page)).toHaveCount(1);
    await expect.poll(() => markers(page).count(), { timeout: 15_000 }).toBe(1);

    await page.locator("#org-search").fill("");
    await aside.getByRole("button", { name: "Clothing", exact: true }).click();
    await expect(orgCards(page)).toHaveCount(0);
    await expect.poll(() => markers(page).count(), { timeout: 15_000 }).toBe(0);
  });

  test("the counter matches the cards", async ({ page }) => {
    await setup(page);
    await openPanel(page);
    await expect(orgCards(page)).toHaveCount(MOCK_NEARBY_ORGS.length, { timeout: 30_000 });
    await expect(page.getByText(/^\d+ organizations found$/).first()).toHaveText(`${MOCK_NEARBY_ORGS.length} organizations found`);
  });

  test("a marker popup shows an organization name as text, never as HTML", async ({ page }) => {
    await setup(page);
    const evil: Organization = {
      ...base,
      id: "evil-1",
      slug: "evil-1",
      name: '<img src=x onerror="window.__xss=1">Evil Pantry',
      address: "<b>1 Bold Street</b>",
    };
    await page.route(/\/api\/nearby/, (route) => json(route, [evil]));
    await page.route(/\/api\/organizations/, (route) => json(route, []));
    await openPanel(page);
    await expect.poll(() => markers(page).count(), { timeout: 15_000 }).toBe(1);

    // The map can sit below the fold; a DOM click opens the popup just as a tap would.
    await markers(page).first().dispatchEvent("click");
    const popup = page.locator(".leaflet-popup-content");
    await expect(popup).toContainText("<img src=x");
    await expect(popup.locator("img[src='x']")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});

test.describe("Merging sources (unit)", () => {
  const org = (id: string, name: string, lat: number, lng: number, verified = false): Organization => ({
    ...base,
    id,
    slug: id,
    name,
    lat,
    lng,
    verified,
    distance: "1 mi",
  });

  test("branches of a chain far apart are all kept", () => {
    const branches = [0, 0.02, 0.04].map((d, i) => org(`b${i}`, "Duane Reade", 40.75 + d, -73.99));
    expect(mergeOrganizations([], branches)).toHaveLength(3);
  });

  test("the same place from two sources is shown once", () => {
    const catalog = [org("c1", "Harvest Food Bank", 40.75, -73.99, true)];
    const osmSame = org("o1", "Harvest Food Bank", 40.7502, -73.9901); // ~25 m away
    const osmOtherNameSamePlace = org("o2", "HFB pantry", 40.75005, -73.99); // within 80 m
    const merged = mergeOrganizations(catalog, [osmSame, osmOtherNameSamePlace]);
    expect(merged.map((o) => o.id)).toEqual(["c1"]);
  });

  test("names in other scripts are not collapsed into one", () => {
    const names = ["مركز الإغاثة", "救助中心", "Centrum Pomocy", "Центр помощи"];
    const merged = mergeOrganizations([], names.map((n, i) => org(`n${i}`, n, 40.7 + i * 0.05, -73.9)));
    expect(merged).toHaveLength(4);
  });

  test("directory entries without coordinates still dedupe by name", () => {
    const withCoords = org("a", "Red Cross", 40.75, -73.99, true);
    const noCoords = { ...org("b", "Red Cross", 0, 0), lat: 0, lng: 0 };
    expect(mergeOrganizations([withCoords], [noCoords])).toHaveLength(1);
  });
});

test.describe("Impact count route", () => {
  test("is a real number with a 60 s cache, or an explicit error, never a silent zero", async ({ request }) => {
    const response = await request.get("/api/impact");
    const body = (await response.json()) as { count: number | null; error?: boolean; reason?: string };
    if (response.ok()) {
      expect(typeof body.count).toBe("number");
      expect(response.headers()["cache-control"]).toContain("s-maxage=60");
    } else {
      expect(response.status()).toBe(503);
      expect(body.error).toBe(true);
      expect(body.count).toBeNull();
      expect(typeof body.reason).toBe("string");
    }
  });
});
