import { test, expect } from "@playwright/test";
import { headerNav, preferFullMode } from "./helpers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await preferFullMode(page);
  });

  test("header links open all main pages", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#nav")).toBeVisible();
    await expect(page.getByRole("link", { name: "Help Nearby" }).first()).toBeVisible();

    const nav = headerNav(page);

    await nav.locator('a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole("heading", { name: /Our Story/i })).toBeVisible();

    await nav.locator('a[href="/why-it-matters"]').click();
    await expect(page).toHaveURL(/\/why-it-matters/);
    await expect(page.getByText(/Cities in Need/i).first()).toBeVisible();

    await nav.locator('a[href="/reviews"]').click();
    await expect(page).toHaveURL(/\/reviews/);
    await expect(page.getByRole("heading", { name: /Reviews/i })).toBeVisible();

    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("language switcher changes UI text", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "RU" }).click();

    await expect(headerNav(page).getByRole("link", { name: "Главная" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Найти помощь рядом со мной" }),
    ).toBeVisible();
  });

  test("footer links and external contacts are present", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /Home/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /help\.nearby1/i })).toHaveAttribute(
      "href",
      /instagram\.com/,
    );
    await expect(footer.getByRole("link", { name: /Kindness Corp/i })).toHaveAttribute(
      "href",
      /t\.me/,
    );
  });
});
