import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  grantNycLocation,
  mockNearbyApi,
  preferFullMode,
} from "./helpers";

const PHONES = [
  { name: "360", width: 360, height: 740 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
];

const noHorizontalScroll = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

async function openResults(page: Page) {
  await grantNycLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".map-panel article").first()).toBeVisible({ timeout: 30_000 });
  // The page scrolls itself (smoothly) to the results half a second after the panel opens;
  // measure only once that scroll has finished.
  await expect
    .poll(
      async () => {
        const before = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(400);
        return before === (await page.evaluate(() => window.scrollY));
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

for (const phone of PHONES) {
  test.describe(`Phone ${phone.name}px`, () => {
    test.use({
      viewport: { width: phone.width, height: phone.height },
      isMobile: true,
      hasTouch: true,
    });

    test.beforeEach(async ({ page }) => {
      await preferFullMode(page);
      await mockNearbyApi(page);
    });

    test("no horizontal page scroll on the main pages", async ({ page }) => {
      for (const route of ["/", "/recent", "/about", "/why-it-matters", "/reviews", "/submit"]) {
        await page.goto(route);
        // networkidle never settles here (analytics script, background fetches): wait for real content.
        await page.waitForLoadState("domcontentloaded");
        await expect(page.locator("main")).toBeVisible();
        if (route === "/") {
          await expect(page.getByRole("button", { name: /Find Help Near Me/i })).toBeVisible();
        }
        expect(await noHorizontalScroll(page), `${route} overflows`).toBeLessThanOrEqual(0);
      }
    });

    test("language switcher opens as a bottom sheet and closes by Esc, backdrop and selection", async ({ page }) => {
      await page.goto("/");
      const trigger = page.getByRole("button", { name: /language/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      await trigger.click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Native names, a checked/current marker on the active one, thumb-sized rows.
      const items = menu.getByRole("menuitem");
      await expect(items).toHaveCount(7);
      await expect(items.nth(0)).toHaveText(/English/);
      await expect(items.nth(1)).toHaveText(/Русский/);
      await expect(menu.locator('[aria-current="true"]')).toContainText("English");
      for (const box of await items.evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().height),
      )) {
        expect(box).toBeGreaterThanOrEqual(44);
      }

      // The sheet is anchored to the bottom edge and spans the full width.
      const sheet = await menu.boundingBox();
      expect(sheet!.width).toBeGreaterThanOrEqual(phone.width - 1);
      expect(Math.round(sheet!.y + sheet!.height)).toBeGreaterThanOrEqual(phone.height - 1);

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Backdrop tap closes.
      await trigger.click();
      await expect(menu).toBeVisible();
      await page.mouse.click(phone.width / 2, 40);
      await expect(menu).toBeHidden();

      // Selecting a language applies it and closes.
      await trigger.click();
      await page.getByRole("menuitem", { name: "Español" }).click();
      await expect(menu).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("lang", "es");
    });

    test("header: emergency is one tap away and the menu opens", async ({ page }) => {
      await page.goto("/");
      const emergency = page.locator(".emergency-icon-btn");
      await expect(emergency).toBeVisible();
      const box = (await emergency.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await emergency.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");

      const toggle = page.locator(".mobile-toggle");
      expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await toggle.click();
      const menu = page.locator("#mmenu");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("link", { name: "Recently added" })).toBeVisible();
      // The menu is a full-screen layer above the header; it has its own close button.
      await menu.getByRole("button", { name: "Close" }).click();
      await expect(menu).toBeHidden();
    });

    test("home: sticky search, one-row filter chips, ~45vh map, one-line card buttons", async ({ page }) => {
      await openResults(page);

      // Filters are a single horizontally scrollable row of chips (all on the same line).
      const chips = page.locator('[role="group"] button[aria-pressed]');
      const tops = await chips.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      for (const h of await chips.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(44);
      }

      // Map: fixed fraction of the screen, list below it.
      const map = (await page.locator(".leaflet-container").first().boundingBox())!;
      expect(map.height).toBeGreaterThanOrEqual(255);
      expect(map.height).toBeLessThanOrEqual(Math.max(420, phone.height * 0.5));
      const firstCard = (await page.locator(".map-panel article").first().boundingBox())!;
      expect(firstCard.y).toBeGreaterThan(map.y + map.height - 1);

      // Cards: Call Now / Get Directions share one row, each at least 44px tall, labels on one line.
      const card = page.locator(".map-panel article").first();
      const call = card.getByRole("link", { name: /Call Now/i });
      const directions = card.getByRole("button", { name: /Get Directions/i });
      await directions.scrollIntoViewIfNeeded();
      const callBox = (await call.boundingBox())!;
      const dirBox = (await directions.boundingBox())!;
      expect(Math.abs(callBox.y - dirBox.y)).toBeLessThan(2);
      expect(callBox.height).toBeGreaterThanOrEqual(44);
      expect(dirBox.height).toBeGreaterThanOrEqual(44);
      expect(dirBox.height).toBeLessThan(60); // a wrapped label would make it taller
      expect(
        await directions.evaluate((el) => getComputedStyle(el).whiteSpace),
      ).toBe("nowrap");

      // The search box stays in view while the list scrolls.
      // (The accordion releases overflow:hidden a moment after opening, then the bar can stick.)
      const search = page.locator("#org-search");
      await expect
        .poll(
          async () => {
            await page.evaluate(() => window.scrollBy(0, 700));
            const top = await search.evaluate((el) => Math.round(el.getBoundingClientRect().top));
            // Scrolled out of view (negative top) is not "stuck": keep polling until it holds at the top.
            return top >= 0 ? top : 9_999;
          },
          { timeout: 8_000 },
        )
        .toBeLessThan(120);
      await expect(search).toBeInViewport();
      expect(await search.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);

      expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    });

    test("chat opens full screen with the input pinned to the bottom", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "AI Assistant" }).click();
      const panel = page.locator(".fixed.bottom-24");
      await expect(panel).toBeVisible();

      const box = (await panel.boundingBox())!;
      expect(Math.round(box.width)).toBe(phone.width);
      expect(Math.round(box.height)).toBeGreaterThanOrEqual(phone.height - 2);

      const input = panel.locator('input[type="text"]');
      const inputBox = (await input.boundingBox())!;
      expect(inputBox.height).toBeGreaterThanOrEqual(44);
      expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(phone.height);
      expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

      await panel.getByLabel("Close chat").click();
      await expect(panel).toBeHidden();
    });

    test("footer: compact grid with unified icons", async ({ page }) => {
      await page.goto("/");
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      const links = footer.locator("ul a");
      await expect(links.first()).toBeVisible();
      for (const h of await links.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(44);
      }
      // Every footer icon shares one size.
      const sizes = await footer
        .locator("ul svg.ui-icon, .contact-btn svg.ui-icon")
        .evaluateAll((els) => els.map((el) => `${el.getBoundingClientRect().width}x${el.getBoundingClientRect().height}`));
      expect(sizes.length).toBeGreaterThan(8);
      expect(new Set(sizes).size).toBe(1);
    });
  });
}

test.describe("Desktop language menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("popover opens, navigates by keyboard, closes on outside click and Esc", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /language/i });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // Focus starts on the current language; ArrowDown moves to the next one.
    await expect(page.getByRole("menuitem", { name: "English" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Русский" })).toBeFocused();

    await page.mouse.click(300, 600);
    await expect(menu).toBeHidden();

    await trigger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
