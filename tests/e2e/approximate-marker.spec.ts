import { test, expect } from "./fixtures";
import type { Page, Route } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  preferFullMode,
} from "./helpers";
import { validateOrganizationForDisplay } from "@/lib/organizationCoordinates";
import { nearbyAreaKey } from "@/lib/nearbyCache";
import type { Organization } from "@/lib/types";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const exactOrg: Organization = {
  ...base,
  id: "9101",
  slug: "e2e-exact-pantry",
  name: "E2E Exact Pantry",
  lat: 40.73,
  lng: -73.995,
  verified: true,
  hoursRaw: "",
};

// ReliefWeb entry carrying a country centroid (geographic centre of the US) as coordinates.
const centroidOrg: Organization = {
  ...base,
  id: "rw-e2e-9102",
  slug: "rw-e2e-9102",
  name: "E2E Centroid Relief Org",
  country: "United States",
  city: "",
  lat: 39.8283,
  lng: -98.5795,
  distance: "1500 mi",
  verified: true,
  hoursRaw: "",
};

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

async function mockSources(page: Page) {
  await mockNearbyApi(page);
  await page.route(/\/api\/organizations/, (route) => json(route, [exactOrg, centroidOrg, { ...centroidOrg, id: "gdho-e2e-near", slug: "gdho-e2e-near", name: "E2E Approximate Near", lat: 40.713, lng: -74.006 }]));
  await page.route(/\/api\/nearby/, (route) => json(route, []));
  await page.route(/\/api\/verified-nearby/, (route) => json(route, [centroidOrg]));
}

test.describe("Nearby results exclude country-level directory entries", () => {
  test("rejects approximate entries even when coordinates appear nearby", () => {
    const location = { lat: 40.7128, lng: -74.006 };
    expect(validateOrganizationForDisplay(centroidOrg, location, 40_000)).toBeNull();
    expect(validateOrganizationForDisplay({ ...centroidOrg, lat: location.lat, lng: location.lng }, location, 40_000)).toBeNull();
    expect(validateOrganizationForDisplay({ ...exactOrg, lat: location.lat + 0.048, lng: location.lng }, location, 5_000)).toBeNull();
    expect(validateOrganizationForDisplay(exactOrg, location, 5_000)).not.toBeNull();
  });

  test("only local organizations appear in the list and on the map", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockSources(page);
    await grantNycLocation(page);
    let directoryRequests = 0;
    page.on("request", (request) => { if (request.url().includes("/api/verified-nearby")) directoryRequests++; });
    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    const list = page.locator(".map-panel article");
    await expect(list.filter({ hasText: "E2E Exact Pantry" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("loading-nearby")).toHaveCount(0, { timeout: 30_000 });
    await expect(list.filter({ hasText: "E2E Centroid Relief Org" })).toHaveCount(0);
    await expect(list.filter({ hasText: "E2E Approximate Near" })).toHaveCount(0);
    await expect(page.locator(".leaflet-marker-icon.custom-marker")).toHaveCount(1);
    expect(directoryRequests).toBe(0);
  });

  test("previously cached results are checked against the active radius", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockSources(page);
    await page.route(/\/api\/organizations/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await json(route, [exactOrg]);
    });
    const outside = { ...exactOrg, id: "9104", name: "E2E Outside Radius", lat: 40.7608, lng: -74.006 };
    await page.addInitScript((entry) => {
      localStorage.setItem("help-nearby-orgs-cache", JSON.stringify(entry));
    }, {
      timestamp: Date.now(), area: nearbyAreaKey(40.7128, -74.006, false),
      organizations: [exactOrg, centroidOrg, outside], searchRadiusMeters: 5_000,
      searchMode: "within", canExpand: true, nearestFallbackKm: null,
    });
    await grantNycLocation(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    const list = page.locator(".map-panel article");
    await expect(list.filter({ hasText: "E2E Exact Pantry" })).toBeVisible({ timeout: 20_000 });
    await expect(list.filter({ hasText: "E2E Centroid Relief Org" })).toHaveCount(0);
    await expect(list.filter({ hasText: "E2E Outside Radius" })).toHaveCount(0);
  });

  test("nearby API does not return country-wide entries as local results", async ({ request }) => {
    const response = await request.post("/api/verified-nearby", {
      data: { country: "United States", lat: 40.7128, lng: -74.006, radius: 5_000 },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
