import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Organization } from "@/lib/types";

export const NYC_GEO = { latitude: 40.7128, longitude: -74.006 };

export const MOCK_NEARBY_ORGS: Organization[] = [
  {
    id: "e2e-food-1",
    slug: "e2e-test-food-bank",
    name: "E2E Test Food Bank",
    category: "food",
    categories: ["food"],
    country: "United States",
    city: "New York",
    lat: 40.758,
    lng: -73.9855,
    distance: "0.5 mi",
    rating: 4.5,
    address: "100 Test Avenue",
    phone: "+15551234567",
    email: "",
    website: "",
    description: "Playwright test organization",
    hours: {},
    hoursRaw: "",
    openNow: true,
    verified: false,
  },
  {
    id: "e2e-shelter-1",
    slug: "e2e-test-shelter",
    name: "E2E Test Shelter",
    category: "shelter",
    categories: ["shelter"],
    country: "United States",
    city: "New York",
    lat: 40.75,
    lng: -73.99,
    distance: "0.8 mi",
    rating: 4,
    address: "200 Shelter Lane",
    phone: "+15559876543",
    email: "",
    website: "",
    description: "Playwright shelter fixture",
    hours: {},
    hoursRaw: "",
    openNow: true,
    verified: false,
  },
];

export async function preferFullMode(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("help-nearby-view-mode", "full");
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("help-nearby-view-mode", "full");
  });
}

export async function mockNearbyApi(page: Page) {
  const orgs = MOCK_NEARBY_ORGS;

  await page.route(/\/api\/nearby/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(orgs),
    });
  });

  await page.route(/\/rest\/v1\/organizations/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "content-range": "0-0/0",
      },
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/api\/geocode\/reverse/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        country: "United States",
        countryCode: "US",
      }),
    });
  });

  await page.route(/\/api\/emergency/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(orgs.filter((o) => o.category === "food")),
    });
  });
}

export async function grantNycLocation(page: Page) {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation(NYC_GEO);
}

export function orgCards(page: Page) {
  return page.locator(".map-panel article");
}

export async function openMapWithOrgs(page: Page) {
  await grantNycLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Loading nearby/i)).toBeHidden({ timeout: 90_000 });

  await expect
    .poll(async () => orgCards(page).count(), { timeout: 30_000 })
    .toBeGreaterThan(0);
}

export function headerNav(page: Page) {
  return page.locator("#nav");
}
