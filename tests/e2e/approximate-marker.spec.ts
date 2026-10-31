import { test, expect } from "./fixtures";
import type { Page, Route } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  preferFullMode,
} from "./helpers";
import { validateOrganizationForDisplay } from "@/lib/organizationCoordinates";
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
  await page.route(/\/api\/organizations/, (route) => json(route, [exactOrg]));
  await page.route(/\/api\/nearby/, (route) => json(route, []));
  await page.route(/\/api\/verified-nearby/, (route) => json(route, [centroidOrg]));
}

test.describe("Approximate (country-level) locations", () => {
  test("display validation drops the distance even when coordinates are present", () => {
    const shown = validateOrganizationForDisplay(
      centroidOrg,
      { lat: 40.7128, lng: -74.006 },
      40_000,
    );
    expect(shown?.distance).toBe("");
  });

  test("a centroid entry is in the list (last, no distance) but has no map marker", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockSources(page);
    await grantNycLocation(page);

    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });

    const list = page.locator(".map-panel article");
    await expect(list.filter({ hasText: "E2E Exact Pantry" })).toBeVisible({ timeout: 20_000 });
    const centroidCard = list.filter({ hasText: "E2E Centroid Relief Org" });
    await expect(centroidCard).toBeVisible({ timeout: 20_000 });

    // Listed last, with no distance label.
    const titles = await page.locator(".map-panel article h3").allTextContents();
    expect(titles.at(-1)).toBe("E2E Centroid Relief Org");
    await expect(centroidCard).not.toContainText(/\d+(\.\d+)?\s*(mi|ft)\b/);

    // No route button or link for the approximate entry; the exact entry still has one.
    await expect(centroidCard.getByRole("button", { name: /Get Directions/i })).toHaveCount(0);
    await expect(centroidCard.getByRole("link", { name: /Get Directions/i })).toHaveCount(0);
    await expect(centroidCard.locator('a[href*="google.com/maps"]')).toHaveCount(0);
    await expect(
      list.filter({ hasText: "E2E Exact Pantry" }).getByRole("button", { name: /Get Directions/i }),
    ).toHaveCount(1);
    // Name, country and a link to the source stay.
    await expect(centroidCard).toContainText("United States");
    await expect(centroidCard.getByRole("link").first()).toBeVisible();

    // Exactly one place marker (the exact pantry); none for the centroid entry.
    await expect(page.locator(".leaflet-marker-icon.custom-marker")).toHaveCount(1);

    // The map stays framed around the exact entries, not stretched towards the US centroid.
    const center = await page.locator(".leaflet-container").first().getAttribute("data-center");
    const [lat, lng] = center!.split(",").map(Number);
    expect(Math.abs(lat! - 40.72)).toBeLessThan(0.2);
    expect(Math.abs(lng! + 74)).toBeLessThan(0.3);
  });
});
