import { test, expect } from "./fixtures";
import {
  grantNycLocation,
  headerNav,
  mockNearbyApi,
  openMapWithOrgs,
  orgCards,
  preferFullMode,
} from "./helpers";

test.describe("Home page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockNearbyApi(page);
    await grantNycLocation(page);
  });

  test("emergency help modal opens and loads list", async ({ page }) => {
    await page.goto("/");

    const emergencyBtn = headerNav(page).getByRole("button", {
      name: /Emergency Help/i,
    });
    await expect(emergencyBtn).toBeVisible();
    await emergencyBtn.click();

    const dialog = page.getByRole("dialog");
    await expect(page.locator("#emergency-dialog-title")).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.getByRole("heading", { name: /24\/7 Emergency Help/i })).toBeVisible();

    await expect(
      dialog.locator("li").first().or(dialog.getByText(/no organizations/i)),
    ).toBeVisible({ timeout: 45_000 });

    await dialog.locator(".relative.z-10 button[aria-label='Close']").click();
    await expect(dialog).toBeHidden();
  });

  test("hero CTA loads organizations and map", async ({ page }) => {
    await openMapWithOrgs(page);
    expect(await orgCards(page).count()).toBeGreaterThan(0);
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 15_000 });
  });

  test("search filters organization list", async ({ page }) => {
    await openMapWithOrgs(page);

    const search = page.locator("#org-search");
    await search.fill("E2E Test Food");
    await expect(orgCards(page)).toHaveCount(1, { timeout: 5_000 });

    await search.fill("zzz-no-match-xyz");
    await expect(orgCards(page)).toHaveCount(0, { timeout: 5_000 });

    await search.fill("");
    await expect(orgCards(page).first()).toBeVisible();
  });

  test("category filters work", async ({ page }) => {
    await openMapWithOrgs(page);

    const total = await orgCards(page).count();
    await page.locator("aside").getByRole("button", { name: "Food", exact: true }).click();

    const filtered = await orgCards(page).count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThanOrEqual(total);
  });

  test("verified organizations show badge and source", async ({ page }) => {
    await openMapWithOrgs(page);

    const verifiedCard = orgCards(page).filter({ hasText: "E2E Test Food Bank" });
    await expect(verifiedCard.getByText(/^Verified$/)).toBeVisible();
  });

  test("lite mode renders list without full map", async ({ page }) => {
    await openMapWithOrgs(page);

    await page.getByRole("button", { name: /Switch to lite mode/i }).click();
    await expect(page.getByText(/Lite mode active/i)).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(orgCards(page).first()).toBeVisible({ timeout: 10_000 });
  });

  test("without geolocation the button shows a message and a search field, no foreign city", async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await preferFullMode(page);
    const nearbyRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(nearby|verified-nearby|organizations|emergency)/.test(request.url())) {
        nearbyRequests.push(request.url());
      }
    });
    await mockNearbyApi(page);

    await page.goto("/");
    // Nothing is searched or shown on open.
    await expect(page.locator(".map-panel")).toHaveCount(0);
    expect(nearbyRequests).toEqual([]);

    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    await expect(page.getByTestId("location-needed")).toContainText(
      "type a city below",
    );
    await expect(page.getByTestId("location-needed").getByRole("button", { name: "Use my location" })).toBeVisible();
    // No place is named until one is known.
    await expect(page.getByTestId("place-chip")).toHaveCount(0);
    await expect(page.locator("#org-search")).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await expect(orgCards(page)).toHaveCount(0);
    expect(nearbyRequests).toEqual([]);
    await context.close();
  });

  test("lite mode never opens the map or loads organizations on its own", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("help-nearby-view-mode", "lite");
    });
    const nearbyRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(nearby|verified-nearby|organizations)/.test(request.url())) {
        nearbyRequests.push(request.url());
      }
    });
    await mockNearbyApi(page);

    await page.goto("/");
    await page.waitForTimeout(1_500);
    await expect(page.locator(".map-panel")).toHaveCount(0);
    await expect(page.getByText(/New York|CityMD/)).toHaveCount(0);
    expect(nearbyRequests).toEqual([]);
    await context.close();
  });

  test("mobile viewport shows the list first and the map behind the Map switch", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openMapWithOrgs(page);

    expect(await orgCards(page).count()).toBeGreaterThan(0);
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
    await page.getByRole("button", { name: "Map", exact: true }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });
});
