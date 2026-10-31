import { test, expect } from "./fixtures";
import type { Page, Route } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  preferFullMode,
} from "./helpers";
import { isCommercialOsmOrganization, limitOsmOrganizations } from "@/lib/osmRelevance";
import { filterOrganizations } from "@/lib/filterOrganizations";
import type { FilterState, Organization } from "@/lib/types";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const niceOrgs: Organization[] = [
  {
    ...base,
    id: "7001",
    slug: "crf-nice-aide-alimentaire",
    name: "Croix-Rouge française – Nice",
    country: "France",
    city: "Nice",
    lat: 43.712,
    lng: 7.265,
    verified: true,
    hoursRaw: "",
    description: "Aide alimentaire.",
  },
];

const nicePlace = {
  name: "Nice, France",
  lat: 43.7102,
  lng: 7.262,
  country: "France",
  countryCode: "FR",
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function mockPlaceApis(page: Page) {
  await mockNearbyApi(page);
  await page.route(/\/api\/geocode(?!\/reverse)/, (route) => {
    const q = (new URL(route.request().url()).searchParams.get("q") ?? "").toLowerCase();
    return json(route, { results: q.includes("nice") ? [nicePlace] : [] });
  });
  await page.route(/\/api\/geocode\/reverse/, (route) => {
    // The position travels in the POST body, never in the URL.
    const lng = Number(route.request().postDataJSON()?.lng);
    return lng > 0 && lng < 20
      ? json(route, { country: "France", countryCode: "FR" })
      : json(route, { country: "United States", countryCode: "US" });
  });
  await page.route(/\/api\/organizations/, (route) => {
    const country = route.request().postDataJSON()?.country;
    return json(route, country === "France" ? niceOrgs : MOCK_NEARBY_ORGS);
  });
  await page.route(/\/api\/nearby/, (route) => json(route, []));
  await page.route(/\/api\/verified-nearby/, (route) => json(route, []));
}

async function openSearch(page: Page) {
  await grantNycLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
}

const card = (page: Page, name: string) =>
  page.locator("article").filter({ hasText: name });

/** True when the map centre is within `tolerance` degrees of the target (the map also fits result markers). */
const mapCenteredNear = (page: Page, lat: number, lng: number, tolerance = 0.05) => async () => {
  const center = await page.locator(".leaflet-container").first().getAttribute("data-center");
  if (!center) return false;
  const [cLat, cLng] = center.split(",").map(Number);
  return Math.abs(cLat! - lat) < tolerance && Math.abs(cLng! - lng) < tolerance;
};

test.describe("Place search", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockPlaceApis(page);
  });

  test("Enter geocodes the text, recenters the map and shows Croix-Rouge results", async ({ page }) => {
    await openSearch(page);
    await expect(card(page, "E2E Test Food Bank")).toBeVisible({ timeout: 20_000 });

    await page.locator("#org-search").fill("Nice, France");
    await page.locator("#org-search").press("Enter");

    await expect(page.getByTestId("place-chip")).toContainText("Searching near Nice, France");
    await expect(card(page, "Croix-Rouge française – Nice")).toBeVisible({ timeout: 20_000 });
    await expect(card(page, "E2E Test Food Bank")).toHaveCount(0);
    await expect.poll(mapCenteredNear(page, 43.7102, 7.262), { timeout: 10_000 }).toBe(true);

    // "Use my location" returns to browser geolocation (mocked NYC).
    await page.getByTestId("place-chip").getByRole("button", { name: "Use my location" }).click();
    await expect(page.getByTestId("place-chip")).toHaveCount(0);
    await expect(card(page, "E2E Test Food Bank")).toBeVisible({ timeout: 20_000 });
    await expect.poll(mapCenteredNear(page, 40.7128, -74.006), { timeout: 10_000 }).toBe(true);
  });

  test("autocomplete suggests places after 3 characters and has a Search places row", async ({ page }) => {
    await openSearch(page);
    const search = page.locator("#org-search");

    await search.fill("Ni");
    await page.waitForTimeout(700);
    await expect(page.getByTestId("place-suggestion")).toHaveCount(0);

    await search.fill("Nice");
    await expect(page.getByTestId("place-suggestion").first()).toHaveText("Nice, France");
    await expect(page.getByTestId("search-places-row")).toContainText("Search places for “Nice”");

    await page.getByTestId("place-suggestion").first().click();
    await expect(page.getByTestId("place-chip")).toContainText("Nice, France");
    await expect(card(page, "Croix-Rouge française – Nice")).toBeVisible({ timeout: 20_000 });
  });

  test("an unknown place shows the not-found message", async ({ page }) => {
    await openSearch(page);
    await page.locator("#org-search").fill("Zzzzqqq");
    await page.locator("#org-search").press("Enter");

    await expect(page.getByTestId("place-error")).toHaveText(
      "Place not found. Try a city name, e.g. Nice, France.",
    );
    await expect(page.getByTestId("place-chip")).toHaveCount(0);
  });

  test("works in lite mode (list only, no map) and on a phone-sized screen", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("help-nearby-view-mode", "lite");
    });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");

    // Geolocation is not granted: pressing the button opens the panel with the message and the search field.
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    const search = page.locator("#org-search");
    await expect(search).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("location-needed")).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(0);

    await search.fill("Nice, France");
    await search.press("Enter");
    await expect(page.getByTestId("place-chip")).toContainText("Nice, France");
    await expect(card(page, "Croix-Rouge française – Nice")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("OSM relevance (unit)", () => {
  const osm = (
    id: string,
    osmKind: string | undefined,
    extra: Partial<Organization> = {},
  ): Organization => ({
    ...base,
    id: `overpass-node-${id}`,
    name: `OSM ${id}`,
    verified: false,
    hoursRaw: "",
    description: "",
    ...(osmKind ? { osmKind } : {}),
    ...extra,
  });
  const allCategories: FilterState = { category: "all", openNow: false, searchQuery: "" };

  test("pharmacies and shops are hidden in All categories; pharmacies show under Medical", () => {
    const pharmacy = osm("1", "pharmacy", { category: "medical", categories: ["medical"] });
    const shop = osm("2", "shop:supermarket");
    const foodBank = osm("3", "food_bank", { category: "food", categories: ["food"] });
    const legacyPharmacy = osm("4", undefined, {
      description: "pharmacy",
      category: "medical",
      categories: ["medical"],
    });
    const verified: Organization = { ...base, id: "55", verified: true };

    expect(isCommercialOsmOrganization(pharmacy)).toBe(true);
    expect(isCommercialOsmOrganization(legacyPharmacy)).toBe(true);
    expect(isCommercialOsmOrganization(foodBank)).toBe(false);
    expect(isCommercialOsmOrganization(verified)).toBe(false);

    const pool = [verified, pharmacy, shop, foodBank, legacyPharmacy];
    expect(filterOrganizations(pool, allCategories).map((o) => o.id)).toEqual([
      "55",
      "overpass-node-3",
    ]);
    expect(
      filterOrganizations(pool, { ...allCategories, category: "medical" }).map((o) => o.id),
    ).toEqual(expect.arrayContaining(["overpass-node-1", "overpass-node-4"]));
  });

  test("caps OSM entries at 30 but never drops verified organizations", () => {
    const many = Array.from({ length: 45 }, (_, i) => osm(`m${i}`, "food_bank"));
    const verified: Organization[] = Array.from({ length: 5 }, (_, i) => ({
      ...base,
      id: `${i + 100}`,
      verified: true,
    }));
    const limited = limitOsmOrganizations([...verified, ...many]);
    expect(limited.filter((o) => o.id.startsWith("overpass-"))).toHaveLength(30);
    expect(limited.filter((o) => o.verified)).toHaveLength(5);
    expect(limited.slice(0, 5).every((o) => o.verified)).toBe(true);
  });
});
