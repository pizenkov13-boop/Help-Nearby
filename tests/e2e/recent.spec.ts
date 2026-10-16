import { test, expect } from "@playwright/test";
import { headerNav, MOCK_NEARBY_ORGS, preferFullMode } from "./helpers";

const recentOrgs = MOCK_NEARBY_ORGS.map((org, i) => ({
  ...org,
  verified: true,
  createdAt: new Date(Date.now() - (i + 3) * 24 * 3600 * 1000).toISOString(),
}));

async function mockRecentApi(page: import("@playwright/test").Page) {
  const requests: string[] = [];
  await page.route(/\/api\/organizations\/recent/, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        organizations: recentOrgs,
        hasMore: false,
        error: false,
      }),
    });
  });
  return requests;
}

test.describe("Recently added organizations", () => {
  test.beforeEach(async ({ page }) => {
    await preferFullMode(page);
  });

  test("is reachable from header and footer navigation", async ({ page }) => {
    await page.goto("/");
    await headerNav(page).getByRole("link", { name: "Recently added" }).click();
    await expect(page).toHaveURL(/\/recent/);
    await expect(
      page.getByRole("heading", { name: /Recently added organizations/i }),
    ).toBeVisible();

    await page.goto("/");
    await expect(
      page.locator("footer").getByRole("link", { name: "Recently added" }),
    ).toHaveAttribute("href", "/recent");
  });

  test("filters fetch from the API and render cards with source and actions", async ({
    page,
  }) => {
    const requests = await mockRecentApi(page);
    await page.goto("/recent");

    // Retry the click until hydration has attached the handler.
    await expect(async () => {
      await page.getByRole("button", { name: "Shelter", exact: true }).click();
      expect(requests.length).toBeGreaterThan(0);
    }).toPass();

    const list = page.getByTestId("recent-list");
    await expect(list.locator("article")).toHaveCount(2);
    expect(requests.at(-1)).toContain("category=shelter");

    const first = list.locator("article").first();
    await expect(first.getByText("Verified")).toBeVisible();
    await expect(first.getByText(/Added 3 days ago/)).toBeVisible();
    await expect(first.getByRole("link", { name: /Call Now/i })).toBeVisible();
    await expect(first.getByRole("link", { name: /Directions/i })).toHaveAttribute(
      "rel",
      /noopener/,
    );
  });

  test("shows an error state with retry", async ({ page }) => {
    let calls = 0;
    await page.route(/\/api\/organizations\/recent/, (route) => {
      calls += 1;
      return route.fulfill({ status: 502, body: "{}" });
    });
    await page.goto("/recent");
    await expect(async () => {
      await page.getByRole("button", { name: "Food", exact: true }).click();
      expect(calls).toBeGreaterThan(0);
    }).toPass();
    await expect(page.getByText(/Could not load/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  test("localizes and switches to RTL for Arabic", async ({ page }) => {
    await page.goto("/recent");
    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "العربية" }).click();

    await expect(
      page.getByRole("heading", { name: "المنظمات المضافة حديثًا" }),
    ).toBeVisible();
    await expect(page.locator("main > div[dir]").first()).toHaveAttribute(
      "dir",
      "rtl",
    );
  });
});
