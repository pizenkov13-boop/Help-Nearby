import { test, expect } from "./fixtures";
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

    await nav.getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole("heading", { name: /How It Works/i })).toBeVisible();

    await nav.getByRole("link", { name: "Why It Matters", exact: true }).click();
    await expect(page).toHaveURL(/\/why-it-matters/);
    await expect(page.getByText(/Cities in Need/i).first()).toBeVisible();

    await nav.getByRole("link", { name: "Reviews", exact: true }).click();
    await expect(page).toHaveURL(/\/reviews/);
    await expect(page.getByRole("heading", { name: /Reviews/i })).toBeVisible();

    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("language switcher changes UI text", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Русский" }).click();

    await expect(headerNav(page).getByRole("link", { name: "Главная" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Помощь рядом со мной" }),
    ).toBeVisible();
  });

  test("footer links to the disclaimer page, in English and Russian", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: "Disclaimer" }).click();
    await expect(page).toHaveURL(/\/disclaimer$/);
    await expect(page.getByTestId("disclaimer-page")).toContainText("reference only and may be inaccurate or out of date");

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Русский" }).click();
    await expect(page.getByTestId("disclaimer-page")).toContainText("Информация справочная и может быть неточной или устаревшей");
  });

  test("footer links and external contacts are present", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /Home/i })).toBeVisible();
    const telegram = footer.getByRole("link", { name: "Telegram", exact: true });
    await expect(telegram).toHaveAttribute("href", "https://t.me/helpnearby_org");
    await expect(telegram).toHaveAttribute("target", "_blank");
    await expect(telegram).toHaveAttribute("rel", "noopener noreferrer");
    await expect(footer.getByRole("link", { name: /Kindness Corp/i })).toHaveAttribute(
      "href",
      /t\.me/,
    );
  });
});
