import { test, expect } from "@playwright/test";
import { mockNearbyApi, preferFullMode } from "./helpers";

/**
 * Runs on the WebKit iPhone 14 project only (see playwright.config.ts).
 * Regression: in dark mode the header's backdrop-filter became the containing block of the
 * `position: fixed` menu, so the open menu collapsed to a ~33px strip under the header.
 */
test.use({ colorScheme: "dark" });

test("open menu is a tall full-screen layer with every item visible and clickable", async ({ page }) => {
  await preferFullMode(page);
  // Registered after preferFullMode, so it runs after that script clears storage.
  await page.addInitScript(() => localStorage.setItem("help-nearby-theme", "dark"));
  await mockNearbyApi(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.locator(".mobile-toggle").tap();
  const menu = page.locator("#mmenu");
  await expect(menu).toBeVisible();

  // The bug: ~33px tall. Now: the whole screen, opaque, above the header.
  const viewport = page.viewportSize()!;
  const box = (await menu.boundingBox())!;
  expect(box.height).toBeGreaterThan(300);
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(Math.round(box.width)).toBe(viewport.width);
  expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(2);
  expect(await menu.evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(/^rgb\(/);

  // Every item is shown, tall enough to tap, and not covered by anything else.
  const items = [
    menu.getByRole("button", { name: "Emergency Help" }),
    ...[
      "Home",
      "About",
      "Why It Matters",
      "Reviews & Suggestions",
      "Recently added",
    ].map((name) => menu.getByRole("link", { name, exact: true })),
    menu.getByRole("button", { name: "English" }),
    menu.getByRole("button", { name: /Switch to (light|dark) mode/i }),
  ];
  for (const item of items) {
    await item.scrollIntoViewIfNeeded();
    await expect(item).toBeVisible();
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(40);
    expect(
      await item.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return Boolean(hit && (hit === el || el.contains(hit)));
      }),
    ).toBe(true);
  }

  // The page behind is frozen while the menu is open, and released on close.
  await expect(page.locator("body")).toHaveCSS("position", "fixed");
  await menu.getByRole("button", { name: "Close" }).tap();
  await expect(menu).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
});
