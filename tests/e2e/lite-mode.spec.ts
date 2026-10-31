import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import {
  isSlowNetworkConnection,
  shouldUseLiteMode,
  type NetworkInformation,
} from "@/lib/liteMode";
import * as liteMode from "@/lib/liteMode";
import { APP_CACHE_VERSION, APP_CACHE_VERSION_KEY } from "@/lib/appCacheVersion";
import { grantNycLocation, mockNearbyApi, orgCards } from "./helpers";

const LITE_NOTICE = /Lite mode active/i;

test.describe("Lite mode signals (unit)", () => {
  test("only Data Saver and slow-2g / 2g count as slow", () => {
    const slow = (c: NetworkInformation | null) => isSlowNetworkConnection(c);
    expect(slow({ saveData: true })).toBe(true);
    expect(slow({ saveData: true, effectiveType: "4g" })).toBe(true);
    expect(slow({ effectiveType: "slow-2g" })).toBe(true);
    expect(slow({ effectiveType: "2g" })).toBe(true);

    expect(slow({ effectiveType: "3g" })).toBe(false);
    expect(slow({ effectiveType: "4g" })).toBe(false);
    expect(slow({ saveData: false, effectiveType: "4g" })).toBe(false);
    expect(slow({})).toBe(false);
    expect(slow(null)).toBe(false); // API missing: never on
  });

  test("a stored choice wins over the detected signal", () => {
    expect(shouldUseLiteMode(true, "full")).toBe(false);
    expect(shouldUseLiteMode(false, "lite")).toBe(true);
    expect(shouldUseLiteMode(true, null)).toBe(true);
    expect(shouldUseLiteMode(false, null)).toBe(false);
  });

  test("nothing measured on our servers and no country list feeds the decision", () => {
    expect(Object.keys(liteMode).sort()).not.toContain("isSlowMeasuredFetch");
    expect(Object.keys(liteMode).sort()).not.toContain("SLOW_FETCH_THRESHOLD_MS");
    expect(Object.keys(liteMode).sort()).not.toContain("isSlowInternetCountry");
    const home = fs.readFileSync(path.join(process.cwd(), "components", "HomePage.tsx"), "utf8");
    expect(home).not.toMatch(/isSlowMeasuredFetch|SLOW_FETCH_THRESHOLD|performance\.now\(\)/);
  });
});

/** Replaces navigator.connection before any page script runs (null = API missing). */
async function fakeConnection(
  page: Page,
  connection: { effectiveType?: string; saveData?: boolean } | null,
) {
  await page.addInitScript(
    ({ conn, versionKey, version }) => {
      localStorage.setItem(versionKey, version);
      const value = conn === null ? undefined : Object.assign(new EventTarget(), conn);
      Object.defineProperty(navigator, "connection", { value, configurable: true });
    },
    { conn: connection, versionKey: APP_CACHE_VERSION_KEY, version: APP_CACHE_VERSION },
  );
}

async function openPanel(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
  await expect(orgCards(page).first()).toBeVisible({ timeout: 30_000 });
}

test.describe("Lite mode trigger", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockNearbyApi(page);
    await grantNycLocation(page);
  });

  test("a slow /api/impact response does NOT switch Lite mode on", async ({ page }) => {
    await fakeConnection(page, { effectiveType: "4g", saveData: false });
    let impactDelayMs = 0;
    await page.route(/\/api\/impact/, async (route) => {
      const started = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 3_000)); // well above the old 2.2 s threshold
      impactDelayMs = Date.now() - started;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ count: 1 }) });
    });

    const impactDone = page.waitForResponse(/\/api\/impact/);
    await openPanel(page);
    await impactDone;
    await page.waitForTimeout(500);

    expect(impactDelayMs).toBeGreaterThanOrEqual(2_900);
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("Data Saver switches Lite mode on", async ({ page }) => {
    await fakeConnection(page, { effectiveType: "4g", saveData: true });
    await openPanel(page);
    await expect(page.getByText(LITE_NOTICE)).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(0);
  });

  for (const effectiveType of ["slow-2g", "2g"]) {
    test(`effectiveType ${effectiveType} switches Lite mode on`, async ({ page }) => {
      await fakeConnection(page, { effectiveType });
      await openPanel(page);
      await expect(page.getByText(LITE_NOTICE)).toBeVisible();
    });
  }

  for (const effectiveType of ["3g", "4g"]) {
    test(`effectiveType ${effectiveType} stays in full mode`, async ({ page }) => {
      await fakeConnection(page, { effectiveType, saveData: false });
      await openPanel(page);
      await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);
      await expect(page.locator(".leaflet-container")).toBeVisible();
    });
  }

  test("without the Network Information API Lite mode stays off", async ({ page }) => {
    await fakeConnection(page, null);
    await openPanel(page);
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("the manual switch is remembered in localStorage, without cookies", async ({ page }) => {
    await fakeConnection(page, { effectiveType: "4g", saveData: false });
    await openPanel(page);
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);

    await page.getByRole("button", { name: /Switch to lite mode/i }).click();
    await expect(page.getByText(LITE_NOTICE)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("help-nearby-view-mode"))).toBe("lite");

    // Remembered after a reload, still on a fast connection.
    await page.reload();
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(LITE_NOTICE)).toBeVisible();

    // And the way back, even when Data Saver is on.
    await page.getByRole("button", { name: /Switch to full version/i }).click();
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("help-nearby-view-mode"))).toBe("full");

    expect(await page.context().cookies()).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe("");
  });

  test("an explicit full-version choice beats Data Saver after a reload", async ({ page }) => {
    await fakeConnection(page, { saveData: true });
    await openPanel(page);
    await expect(page.getByText(LITE_NOTICE)).toBeVisible();
    await page.getByRole("button", { name: /Switch to full version/i }).click();
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);

    await page.reload();
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(LITE_NOTICE)).toHaveCount(0);
  });
});
