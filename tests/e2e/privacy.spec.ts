import { test, expect } from "@playwright/test";
import { mockNearbyApi, preferFullMode } from "./helpers";

const THIRD_PARTIES = [
  "tile.openstreetmap.org",
  "Nominatim",
  "Overpass",
  "OSRM",
  "api.aitunnel.ru",
  "Umami",
  "Supabase",
];

test.describe("Privacy page", () => {
  test("English: the promises and every third-party service are listed", async ({ page }) => {
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");
    await expect(content).toBeVisible();

    await expect(content).toContainText("No accounts");
    await expect(content).toContainText("No tracking cookies");
    await expect(content).toContainText("not saved in our database");
    for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
    await expect(content).toContainText("Review:");
    await expect(content).toContainText("Add an organization:");
  });

  test("Russian interface language shows the Russian text", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hn-language", "ru"));
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");
    await expect(content).toContainText("Нет аккаунтов");
    await expect(content).toContainText("Нет отслеживающих cookie");
    await expect(content).toContainText("не сохраняется");
    for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
    await expect(content).toContainText("Отзыв:");
    await expect(content).toContainText("Добавление организации:");
  });

  test("the footer links to it", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.goto("/about");
    await page.locator("footer").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByTestId("privacy-page")).toBeVisible();
  });

  test("it is listed in the sitemap", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(await res.text()).toContain("https://help-nearby.org/privacy</loc>");
  });
});
