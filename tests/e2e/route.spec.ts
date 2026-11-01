import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  NYC_GEO,
  preferFullMode,
} from "./helpers";

const withPhone = MOCK_NEARBY_ORGS[0];
const withoutPhone = { ...MOCK_NEARBY_ORGS[1], id: "e2e-nophone-1", slug: "e2e-nophone", name: "E2E No Phone Pantry", phone: "" };

const OK_ROUTE = (mode: string) => ({
  coordinates: [
    [NYC_GEO.latitude, NYC_GEO.longitude],
    [40.74, -73.99],
    [40.758, -73.9855],
  ],
  distanceKm: 5.4,
  durationMinutes: 68,
  mode,
  steps: [],
});

/** Records every window.open call and every popup so a test can prove nothing leaves the site. */
async function watchExternalNavigation(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __opens: unknown[] }).__opens = [];
    window.open = (...args: unknown[]) => {
      (window as unknown as { __opens: unknown[] }).__opens.push(args);
      return null;
    };
  });
  const popups: string[] = [];
  page.on("popup", (popup) => popups.push(popup.url()));
  return {
    popups,
    opens: () => page.evaluate(() => (window as unknown as { __opens: unknown[] }).__opens),
  };
}

async function openResults(page: Page, orgs = [withPhone, withoutPhone]) {
  await preferFullMode(page);
  await mockNearbyApi(page);
  await page.route(/\/api\/(nearby|organizations)/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(orgs) }),
  );
  await grantNycLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator(".map-panel article").first()).toBeVisible({ timeout: 30_000 });
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

test.describe("No route button leaves the site (source)", () => {
  test("no map-provider link and no window.open anywhere in app, components or lib", () => {
    const hits: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const file of sourceFiles(join(process.cwd(), dir))) {
        const text = readFileSync(file, "utf8");
        if (/google\.com\/maps|maps\.google|maps\.apple|maps\.yandex|yandex\.[a-z]+\/maps|window\.open\s*\(/i.test(text)) {
          hits.push(file);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

test.describe("Organization sheet and in-site route", () => {
  let routeModes: string[] = [];
  test.beforeEach(async ({ page }) => {
    routeModes = [];
    await page.route(/\/api\/route/, (route) => {
      const body = JSON.parse(route.request().postData() ?? "{}") as { mode?: string };
      routeModes.push(body.mode ?? "walking");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK_ROUTE(body.mode ?? "walking")) });
    });
  });

  test("tapping an organization opens the sheet; Call is a clean tel: link; Route stays on the site", async ({ page }) => {
    const nav = await watchExternalNavigation(page);
    await openResults(page);
    const startUrl = page.url();

    await page.locator(".map-panel article").first().getByRole("button", { name: withPhone.name }).click();
    const sheet = page.getByTestId("org-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: withPhone.name })).toBeVisible();
    await expect(sheet.getByText(withPhone.address)).toBeVisible();
    await expect(sheet.getByTestId("sheet-distance")).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Call Now/i })).toHaveAttribute("href", "tel:+15551234567");

    await sheet.getByRole("button", { name: /Get Directions/i }).click();
    const screen = page.getByTestId("route-screen");
    await expect(screen).toBeVisible();
    await expect(page.getByTestId("route-map")).toBeVisible();
    await expect(page.getByTestId("route-summary")).toContainText(/\d/);
    // One walking route, no travel-mode switch.
    expect(routeModes).toEqual(["walking"]);
    await expect(screen.getByRole("button", { name: /By car|On foot/ })).toHaveCount(0);

    expect(page.url()).toBe(startUrl);
    expect(nav.popups).toEqual([]);
    expect(await nav.opens()).toEqual([]);
    expect(await page.locator('a[href*="maps.google"], a[href*="google.com/maps"], a[href*="maps.apple"], a[href*="yandex"]').count()).toBe(0);

    // Back returns to the sheet of the same organization.
    await screen.getByRole("button", { name: "Back" }).click();
    await expect(screen).toHaveCount(0);
    await expect(page.getByTestId("org-sheet").getByRole("heading", { name: withPhone.name })).toBeVisible();
  });

  test("an organization without a phone has no Call button and Route fills the width", async ({ page }) => {
    await openResults(page, [withoutPhone]);
    await page.locator(".map-panel article").first().getByRole("button", { name: withoutPhone.name }).click();
    const sheet = page.getByTestId("org-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Call Now/i })).toHaveCount(0);
    await expect(sheet.locator('a[href^="tel:"]')).toHaveCount(0);
    const route = sheet.getByRole("button", { name: /Get Directions/i });
    const sheetBox = (await sheet.locator(".os-sheet").boundingBox())!;
    const routeBox = (await route.boundingBox())!;
    expect(routeBox.width).toBeGreaterThan(sheetBox.width * 0.8);
  });

  test("the card Route button opens the same in-site route screen", async ({ page }) => {
    const nav = await watchExternalNavigation(page);
    await openResults(page);
    await page.locator(".map-panel article").first().getByRole("button", { name: /Get Directions/i }).click();
    await expect(page.getByTestId("route-screen")).toBeVisible();
    expect(nav.popups).toEqual([]);
    expect(await nav.opens()).toEqual([]);
  });

  test("when the route cannot be built it says so and offers Retry, with no straight line", async ({ page }) => {
    let calls = 0;
    await page.unroute(/\/api\/route/);
    await page.route(/\/api\/route/, (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "down" }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK_ROUTE("walking")) });
    });
    const nav = await watchExternalNavigation(page);
    await openResults(page);
    await page.locator(".map-panel article").first().getByRole("button", { name: /Get Directions/i }).click();
    const failed = page.getByTestId("route-failed");
    await expect(failed).toContainText("Could not build the route");
    await expect(page.getByText("Approximate")).toHaveCount(0);
    await expect(page.locator(".rt-map path.leaflet-interactive")).toHaveCount(0);
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByTestId("route-summary")).toBeVisible();
    expect(calls).toBe(2);
    expect(nav.popups).toEqual([]);
    expect(await nav.opens()).toEqual([]);
  });

  test("Urgent: tapping an organization opens the same sheet", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await grantNycLocation(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Emergency Help" }).first().click();
    const urgent = page.getByRole("dialog").first();
    await urgent.getByRole("button", { name: withPhone.name }).click();
    const sheet = page.getByTestId("org-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Call Now/i })).toHaveAttribute("href", /^tel:\+?\d+$/);
    await expect(sheet.getByRole("button", { name: /Get Directions/i })).toBeVisible();
  });
});

test.describe("Route without a position", () => {
  test("shows a plain message with an Allow button, no typed place, and never routes without a start", async ({ page }) => {
    let routeCalls = 0;
    await page.route(/\/api\/route/, (route) => {
      routeCalls += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK_ROUTE("walking")) });
    });
    await preferFullMode(page);
    await mockNearbyApi(page);
    // No geolocation permission at all.
    await page.goto("/");
    const need = page.getByTestId("route-need-location");
    // Retry the dispatch until hydration has attached the listener.
    await expect(async () => {
      await page.evaluate((org) => window.dispatchEvent(new CustomEvent("hn:route-open", { detail: org })), withPhone);
      await expect(need).toBeVisible({ timeout: 1_000 });
    }).toPass();
    await expect(need).toContainText("We need to know where you are");
    await expect(need.getByRole("button", { name: "Allow location" })).toBeVisible();
    await expect(page.getByTestId("route-screen").getByRole("textbox")).toHaveCount(0);
    expect(routeCalls).toBe(0);
  });
});
