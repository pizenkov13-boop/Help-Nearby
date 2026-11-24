import { test, expect } from "./fixtures";
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
    await expect(first.getByText("Open sources")).toBeVisible();
    await expect(first.getByText(/Added 3 days ago/)).toBeVisible();
    await expect(first.getByRole("link", { name: /Call Now/i })).toBeVisible();
    // Directions open our own route screen: a button, never a link to another site.
    await expect(first.getByRole("button", { name: /Directions/i })).toBeVisible();
    await expect(first.getByRole("link", { name: /Directions/i })).toHaveCount(0);
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

  test("shows category badges in the selected language", async ({ page }) => {
    await mockRecentApi(page);
    await page.goto("/recent");
    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Русский" }).click();
    await page.getByRole("button", { name: "Еда", exact: true }).click();
    const cards = page.getByTestId("recent-list").locator("article");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0).getByText("Еда", { exact: true })).toBeVisible();
    await expect(cards.nth(1).getByText("Приют", { exact: true })).toBeVisible();
    await expect(cards.getByText("food", { exact: true })).toHaveCount(0);
  });

  test("country selector rotates its arrow when opened", async ({ page }) => {
    await page.goto("/recent");
    const trigger = page.getByRole("button", { name: /Country.*All countries/i });
    const arrow = trigger.locator(".country-select-chevron");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => arrow.evaluate((el) => getComputedStyle(el).transform)).toBe("matrix(-1, 0, 0, -1, 0, 0)");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
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
