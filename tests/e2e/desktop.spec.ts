import { test, expect } from "./fixtures";
import { mockNearbyApi, preferFullMode } from "./helpers";

/** The desktop home page must keep its original layout; the phone redesign stays below 769px. */
for (const size of [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
]) {
  test.describe(`Desktop ${size.width}px`, () => {
    test.use({ viewport: size });

    test.beforeEach(async ({ page }) => {
      await preferFullMode(page);
      await mockNearbyApi(page);
    });

    test("home: five tiles in a row under a white Find Help Near Me button, no phone bottom bar", async ({ page }) => {
      await page.goto("/");
      const tiles = page.locator(".hero-tile");
      await expect(tiles).toHaveCount(5);
      await expect(tiles.nth(0)).toContainText("Food");
      await expect(tiles.nth(4)).toContainText("Volunteer");
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));

      // One row: every tile on the same line, side by side, all the same size.
      const boxes = await tiles.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
      expect(new Set(boxes.map((b) => Math.round(b.width))).size).toBe(1);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].left).toBeGreaterThan(boxes[i - 1].right - 1);

      // The white button sits above the tiles, on one line, with the dark-blue label.
      const cta = page.getByRole("button", { name: "Find Help Near Me" });
      await expect(cta).toBeVisible();
      const style = await cta.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, wrapped: el.scrollWidth > el.clientWidth + 1 };
      });
      expect(style.bg).toBe("rgb(255, 255, 255)");
      expect(style.color).toBe("rgb(29, 78, 216)");
      expect(style.wrapped).toBe(false);
      const ctaBox = (await cta.boundingBox())!;
      expect(ctaBox.y + ctaBox.height).toBeLessThan(boxes[0].top);

      // None of the phone-only pieces show up.
      await expect(page.locator(".bottom-bar")).toBeHidden();
      await expect(page.locator(".hero-trust")).toBeHidden();
      await expect(page.locator(".hero-how")).toBeHidden();
      await expect(page.locator(".header .lang-btn")).toBeVisible();
      await expect(page.getByRole("button", { name: "Emergency Help" }).first()).toBeVisible();
    });

    test("a tile still searches its category from the desktop home page", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".hero-tile")).toHaveCount(5);
      await page.locator(".hero-tile", { hasText: "Shelter" }).click();
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
    });

    test("results card keeps the original compact look, with Call Now and Get Directions side by side", async ({ page }) => {
      await page.context().grantPermissions(["geolocation"]);
      await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
      await page.goto("/");
      await page.getByRole("button", { name: "Find Help Near Me" }).click();
      const card = page.locator(".map-panel article").first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      // No phone list/map switch and no big phone buttons.
      await expect(page.locator(".view-seg")).toHaveCount(0);
      const call = card.getByRole("link", { name: /Call Now/i });
      const route = card.getByRole("button", { name: /Get Directions/i });
      const callBox = (await call.boundingBox())!;
      const routeBox = (await route.boundingBox())!;
      expect(callBox.height).toBeLessThan(52);
      expect(Math.abs(callBox.y - routeBox.y)).toBeLessThan(2);
      expect(routeBox.x).toBeGreaterThan(callBox.x);
    });

    test("footer links Telegram, not Instagram", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator('footer a[href*="t.me"]').first()).toBeVisible();
      await expect(page.locator('footer a[href*="instagram"]')).toHaveCount(0);
    });
  });
}
