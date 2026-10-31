import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
  mockNearbyApi,
  preferFullMode,
} from "./helpers";
import type { Organization } from "@/lib/types";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const supabaseOrg: Organization = {
  ...base,
  id: "9001",
  slug: "e2e-supabase-pantry",
  name: "E2E Supabase Pantry",
  lat: 40.73,
  lng: -73.995,
  verified: true,
  hoursRaw: "",
};

const overpassOrg: Organization = {
  ...base,
  id: "overpass-node-9002",
  slug: "osm-node-9002-e2e-overpass-kitchen",
  name: "E2E Overpass Kitchen",
  lat: 40.74,
  lng: -73.99,
  verified: false,
  hoursRaw: "",
};

const ochaOrg: Organization = {
  ...base,
  id: "hdx-e2e-9003",
  slug: "hdx-e2e-9003",
  name: "E2E OCHA Relief Org",
  country: "United States",
  city: "",
  lat: 0,
  lng: 0,
  distance: "",
  verified: true,
  hoursRaw: "",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Delays = { supabase: number; osm: number; ocha: number | "never" };

async function mockSlowSources(page: Page, delays: Delays, empty = false) {
  await mockNearbyApi(page);

  const respond = (orgs: Organization[], delay: number | "never") => async (route: import("@playwright/test").Route) => {
    if (delay === "never") return; // the client must give up on its own
    await sleep(delay);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(empty ? [] : orgs),
    });
  };

  // Registered after mockNearbyApi, so these take precedence.
  await page.route(/\/api\/organizations/, respond([supabaseOrg], delays.supabase));
  await page.route(/\/api\/nearby/, respond([overpassOrg], delays.osm));
  await page.route(/\/api\/verified-nearby/, respond([ochaOrg], delays.ocha));
  await page.route(/\/api\/geocode(?!\/reverse)/, (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
  );
}

async function startSearch(page: Page) {
  await grantNycLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
}

const card = (page: Page, name: string) =>
  page.locator("article").filter({ hasText: name });

test.describe("Progressive nearby search", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
  });

  test("Supabase results appear before OSM and OCHA finish; sources merge without reset", async ({ page }) => {
    await mockSlowSources(page, { supabase: 200, osm: 3_000, ocha: 5_500 });
    await startSearch(page);

    // Supabase is first; the others are still pending (loading badge + per-source status).
    await expect(card(page, "E2E Supabase Pantry")).toBeVisible({ timeout: 2_500 });
    await expect(card(page, "E2E Overpass Kitchen")).toHaveCount(0);
    await expect(card(page, "E2E OCHA Relief Org")).toHaveCount(0);
    await expect(page.getByTestId("loading-nearby")).toBeVisible();
    await expect(page.getByTestId("source-osm")).toBeVisible();
    await expect(page.getByTestId("source-ocha")).toBeVisible();
    await expect(page.getByTestId("source-supabase")).toHaveCount(0);

    // OSM merges in; the Supabase card is still there (list was not reset).
    await expect(card(page, "E2E Overpass Kitchen")).toBeVisible({ timeout: 6_000 });
    await expect(card(page, "E2E Supabase Pantry")).toBeVisible();
    // Unverified OSM results are shown (not hidden) with a provenance badge, below verified ones.
    await expect(
      card(page, "E2E Overpass Kitchen").getByTestId("unverified-osm-badge"),
    ).toHaveText("Unverified · OpenStreetMap");
    await expect(
      card(page, "E2E Supabase Pantry").getByTestId("unverified-osm-badge"),
    ).toHaveCount(0);
    const order = await page.locator("article h3").allTextContents();
    expect(order.indexOf("E2E Supabase Pantry")).toBeLessThan(
      order.indexOf("E2E Overpass Kitchen"),
    );
    await expect(page.getByTestId("source-osm")).toHaveCount(0);
    await expect(page.getByTestId("loading-nearby")).toBeVisible(); // OCHA still pending

    // OCHA arrives as a list-only country-level entry; then the badge goes away.
    await expect(card(page, "E2E OCHA Relief Org")).toBeVisible({ timeout: 6_000 });
    await expect(card(page, "E2E Supabase Pantry")).toBeVisible();
    // Few results make the search widen its radius, which re-queries OSM for a moment.
    await expect(page.getByTestId("loading-nearby")).toHaveCount(0, { timeout: 20_000 });
  });

  test("a source that never answers does not block the others and the spinner stops", async ({ page }) => {
    await mockSlowSources(page, { supabase: 100, osm: 100, ocha: "never" });
    await startSearch(page);

    await expect(card(page, "E2E Supabase Pantry")).toBeVisible({ timeout: 5_000 });
    await expect(card(page, "E2E Overpass Kitchen")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("source-ocha")).toBeVisible();

    // The client gives up on OCHA after its own timeout; results stay and loading stops.
    await expect(page.getByTestId("loading-nearby")).toHaveCount(0, { timeout: 15_000 });
    await expect(card(page, "E2E Supabase Pantry")).toBeVisible();
    await expect(card(page, "E2E Overpass Kitchen")).toBeVisible();
    await expect(card(page, "E2E OCHA Relief Org")).toHaveCount(0);
  });

  test("when every source returns nothing the spinner stops with the empty text and a larger-radius button", async ({ page }) => {
    await mockSlowSources(page, { supabase: 50, osm: 50, ocha: 50 }, true);
    await startSearch(page);

    await expect(page.getByTestId("loading-nearby")).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByText(/No verified organizations/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try a larger radius" })).toBeVisible();
  });
});
