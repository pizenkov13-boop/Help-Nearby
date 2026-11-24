import { test, expect } from "./fixtures";
import { preferFullMode } from "./helpers";

async function expectSectionPosition(page: import("@playwright/test").Page, id: string) {
  await expect.poll(async () => {
    const box = await page.locator(`#${id}`).boundingBox();
    return box ? Math.round(box.y) : null;
  }, { timeout: 10_000 }).toBeGreaterThanOrEqual(70);
  await expect.poll(async () => {
    const box = await page.locator(`#${id}`).boundingBox();
    return box ? Math.round(box.y) : null;
  }, { timeout: 10_000 }).toBeLessThanOrEqual(90);
}

test("desktop section links scroll after navigation and on the same page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await preferFullMode(page);
  // A slow destination must still scroll after its content arrives.
  await page.route("**/about*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await route.continue();
  });
  await page.goto("/");

  const about = page.locator(".nav-dd").filter({ has: page.getByRole("link", { name: "About", exact: true }) });
  await about.locator(".dd-chevron").click();
  await about.getByRole("link", { name: "What We Believe" }).click();
  await expect(page).toHaveURL(/\/about#what-we-believe$/);
  await expectSectionPosition(page, "what-we-believe");

  await about.locator(".dd-chevron").click();
  await about.getByRole("link", { name: "How It Works" }).click();
  await expectSectionPosition(page, "how-it-works");

  const why = page.locator(".nav-dd").filter({ has: page.getByRole("link", { name: "Why It Matters", exact: true }) });
  await why.locator(".dd-chevron").click();
  await why.getByRole("link", { name: "Our Solution" }).click();
  await expect(page).toHaveURL(/\/why-it-matters#our-solution$/);
  await expectSectionPosition(page, "our-solution");
});

test("phone menu closes without scrolling back to the header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await preferFullMode(page);
  await page.goto("/");
  await page.locator(".mobile-toggle").click();
  await page.locator("#mmenu").getByRole("link", { name: "What We Believe" }).click();
  await expect(page).toHaveURL(/\/about#what-we-believe$/);
  await expectSectionPosition(page, "what-we-believe");
});
