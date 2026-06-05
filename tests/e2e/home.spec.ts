import { test, expect } from "@playwright/test";
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
    expect(await orgCards(page).count()).toBeGreaterThan(0);
  });

  test("mobile viewport shows map and organization list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openMapWithOrgs(page);

    await expect(page.locator(".leaflet-container")).toBeVisible();
    expect(await orgCards(page).count()).toBeGreaterThan(0);
  });
});
