import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import {
  grantNycLocation,
  MOCK_NEARBY_ORGS,
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

    test("emergency is one tap away in the bottom bar and the menu opens", async ({ page }) => {
      await page.goto("/");
      const emergency = page.getByRole("button", { name: "Emergency Help" });
      await expect(emergency).toBeVisible();
      const box = (await emergency.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
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

    test("results: list first, large cards, map behind a List / Map switch", async ({ page }) => {
      // Every organization is open around the clock, so the open/closed mark is shown.
      const allDay = { open: "00:00", close: "23:59" };
      const hours = {
        monday: allDay, tuesday: allDay, wednesday: allDay, thursday: allDay,
        friday: allDay, saturday: allDay, sunday: allDay,
      };
      await page.route(/\/api\/(nearby|organizations)/, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_NEARBY_ORGS.map((o) => ({ ...o, hours, hoursRaw: "24/7" }))),
        }),
      );
      await openResults(page);

      // The list is what you see first; the map is not even loaded until asked for.
      await expect(page.locator(".leaflet-container")).toHaveCount(0);
      const toggle = page.getByRole("group", { name: /List \/ Map/ });
      await expect(toggle).toBeVisible();
      for (const h of await toggle.getByRole("button").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(44);
      }
      await expect(toggle.getByRole("button", { name: "List", pressed: true })).toBeVisible();

      // Filters are a single horizontally scrollable row of chips (all on the same line).
      const chips = page.locator('[role="group"] button[aria-pressed]:not(:text-is("List")):not(:text-is("Map"))');
      const tops = await chips.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(1);
      for (const h of await chips.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(44);
      }

      // Card: big distance, status, verified mark, readable text, and the two actions side by side.
      const card = page.locator(".map-panel article").first();
      await card.scrollIntoViewIfNeeded();
      expect(await card.getByTestId("org-distance").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);
      await expect(card.getByTestId("open-status")).toHaveText(/Open now/);
      await expect(card.getByText("Verified")).toBeVisible();
      for (const size of await card.locator("span, p, a, button").evaluateAll((els) =>
        els
          .filter((el) => (el.textContent ?? "").trim().length > 0 && el.children.length === 0)
          .map((el) => parseFloat(getComputedStyle(el).fontSize)),
      )) {
        expect(size).toBeGreaterThanOrEqual(13);
      }

      const call = card.getByRole("link", { name: /Call Now/i });
      const directions = card.getByRole("button", { name: /Get Directions/i });
      await expect(call).toHaveAttribute("href", /^tel:\+?\d+/);
      const callBox = (await call.boundingBox())!;
      const dirBox = (await directions.boundingBox())!;
      const cardBox = (await card.boundingBox())!;
      for (const box of [callBox, dirBox]) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(cardBox.width * 0.4);
      }
      expect(await directions.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("nowrap");

      // The switch brings the map in (and the list out).
      await page.getByRole("button", { name: "Map", exact: true }).click();
      const map = page.locator(".leaflet-container");
      await expect(map).toBeVisible({ timeout: 15_000 });
      const mapBox = (await map.first().boundingBox())!;
      expect(mapBox.height).toBeGreaterThanOrEqual(300);
      await expect(page.locator(".map-panel article").first()).toBeHidden();
      await page.getByRole("button", { name: "List", exact: true }).click();
      await expect(page.locator(".map-panel article").first()).toBeVisible();
      await expect(map).toHaveCount(0);

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

      expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    });

    test("results: Get Directions opens the in-site route screen", async ({ page }) => {
      await openResults(page);
      await page.locator(".map-panel article").first().getByRole("button", { name: /Get Directions/i }).click();
      await expect(page.getByTestId("route-screen")).toBeVisible();
      await expect(page.getByTestId("route-map")).toBeVisible({ timeout: 15_000 });
      expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    });

    test("home: tiles, main button and bottom bar are tidy, thumb-sized and cover nothing", async ({ page }) => {
      await page.goto("/");
      // Tiles fade in one after another: measure once the entrance animation has finished.
      await page.evaluate(() => Promise.all(document.getAnimations().map((anim) => anim.finished.catch(() => undefined))));
      const tiles = page.locator(".hero-tile");
      await expect(tiles).toHaveCount(4);
      const rects = await tiles.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      for (const b of rects) {
        expect(b.width).toBeGreaterThanOrEqual(48);
        expect(b.height).toBeGreaterThanOrEqual(88);
        expect(b.right).toBeLessThanOrEqual(phone.width);
      }
      // 2x2 grid, all four the same height, two per row.
      expect(new Set(rects.map((r) => Math.round(r.height))).size).toBe(1);
      expect(new Set(rects.map((r) => Math.round(r.top))).size).toBe(2);
      for (const clipped of await tiles.evaluateAll((els) => els.map((el) => el.scrollWidth > el.clientWidth + 1))) {
        expect(clipped).toBe(false);
      }

      // Volunteering: a quiet full-width row under the grid.
      const row = page.locator(".hero-row");
      const rowBox = (await row.boundingBox())!;
      expect(rowBox.height).toBeGreaterThanOrEqual(52);
      expect(rowBox.y).toBeGreaterThan(rects[3].bottom);
      expect(Math.abs(rowBox.width - (rects[1].right - rects[0].left))).toBeLessThan(2);

      // The main button: one calm blue-teal gradient, 56px, one line, 17px.
      const cta = page.getByRole("button", { name: /Find help near me/i });
      const ctaBox = (await cta.boundingBox())!;
      expect(ctaBox.height).toBeGreaterThanOrEqual(56);
      expect(ctaBox.height).toBeLessThan(68);
      expect(await cta.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      const style = await cta.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundImage, size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) };
      });
      expect(style.bg).toContain("linear-gradient");
      expect(style.size).toBe(17);
      expect(style.weight).toBeGreaterThanOrEqual(600);

      // Bottom bar: three equal items (the language switcher lives in the header), at most 64px high.
      const bar = page.locator(".bottom-bar");
      await expect(bar).toBeVisible();
      const barBox = (await bar.boundingBox())!;
      expect(Math.round(barBox.y + barBox.height)).toBe(phone.height);
      expect(barBox.height).toBeLessThanOrEqual(64);
      const items = await bar.locator(".bb-item").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      expect(items).toHaveLength(3);
      expect(new Set(items.map((b) => Math.round(b.width))).size).toBe(1);
      for (const b of items) {
        expect(b.width).toBeGreaterThanOrEqual(48);
        expect(b.height).toBeGreaterThanOrEqual(48);
      }
      // Labels stay on one line, icons are 24px.
      for (const wrapped of await bar.locator(".bb-label").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height > 18))) {
        expect(wrapped).toBe(false);
      }
      expect(await bar.locator(".bb-pill svg").first().evaluate((el) => el.getBoundingClientRect().width)).toBe(24);
      // The round chat button is gone on phones (the bar has a chat item).
      await expect(page.locator("button.fixed.rounded-full")).toBeHidden();

      // No hole below the hero: the trust line sits above the bar on the first screen and How it works follows right after it.
      await expect(page.locator(".hero-trust")).toContainText("OpenStreetMap");
      const howLink = page.locator(".hero-how");
      expect((await howLink.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      expect((await page.locator(".hero-trust").boundingBox())!.y).toBeLessThan(barBox.y);
      const gap = (await page.locator("#how-it-works").boundingBox())!.y - (await howLink.boundingBox())!.y - 48;
      expect(gap).toBeLessThan(64);

      // Scrolled to the very end, the last line of the footer sits above the bar.
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      await expect
        .poll(() => page.locator("footer").evaluate((el) => el.getBoundingClientRect().bottom))
        .toBeLessThanOrEqual(barBox.y + 1);
      expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    });

    test("home: Volunteer row searches that category", async ({ page }) => {
      await grantNycLocation(page);
      await page.goto("/");
      await page.locator(".hero-row").click();
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: "Volunteer", pressed: true })).toBeVisible();
    });

    test("home: a category tile starts the search with that category selected", async ({ page }) => {
      await grantNycLocation(page);
      await page.goto("/");
      await page.locator(".hero-tile", { hasText: "Shelter" }).click();
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: "Shelter", pressed: true })).toBeVisible();
    });

    test("a tile searches that category, Find Help Near Me searches all of them", async ({ page }) => {
      await grantNycLocation(page);
      await page.goto("/");
      await page.locator(".hero-tile", { hasText: "Food" }).click();
      const cards = page.locator(".map-panel article");
      await expect(cards.first()).toBeVisible({ timeout: 30_000 });
      await expect(cards).toHaveCount(1);
      await expect(cards.first()).toContainText("E2E Test Food Bank");

      await page.getByRole("button", { name: /Find Help Near Me/i }).click();
      await expect(cards).toHaveCount(2);
    });

    test("bottom bar: Find starts the search", async ({ page }) => {
      await grantNycLocation(page);
      await page.goto("/");
      await page.locator(".bottom-bar").getByRole("button", { name: "Find" }).click();
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
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
