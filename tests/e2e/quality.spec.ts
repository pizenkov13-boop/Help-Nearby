import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { grantNycLocation, MOCK_NEARBY_ORGS, mockNearbyApi, preferFullMode } from "./helpers";

const LANGS = [
  { code: "en", locale: "en-US", trust: /OpenStreetMap/ },
  { code: "ru", locale: "ru-RU", trust: /OpenStreetMap/ },
  { code: "es", locale: "es-ES", trust: /OpenStreetMap/ },
  { code: "fr", locale: "fr-FR", trust: /OpenStreetMap/ },
  { code: "de", locale: "de-DE", trust: /OpenStreetMap/ },
  { code: "zh", locale: "zh-CN", trust: /OpenStreetMap/ },
  { code: "ar", locale: "ar", trust: /OpenStreetMap/ },
];
const WIDTHS = [360, 390, 430];

/** Nothing sticks out of the screen and no text is cut off inside a box. */
async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    if (document.documentElement.scrollWidth > vw) out.push(`horizontal scroll ${document.documentElement.scrollWidth - vw}px`);
    const inScroller = (el: Element) => {
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const o = getComputedStyle(n).overflowX;
        if ((o === "auto" || o === "scroll") && n.scrollWidth > n.clientWidth) return true;
      }
      return false;
    };
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (el.closest(".leaflet-container, .sr-only, nextjs-portal") || inScroller(el)) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.position === "fixed" || cs.visibility === "hidden") continue;
      const text = (el.textContent ?? "").trim().slice(0, 24);
      if (r.right > vw + 1 || r.left < -1) out.push(`off-screen: ${el.className} "${text}"`);
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim());
      if (own && cs.overflow !== "visible" && cs.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 1) out.push(`clipped: ${el.className} "${text}"`);
    }
    return out;
  });
}

for (const lang of LANGS) {
  for (const width of WIDTHS) {
    test.describe(`${lang.code} at ${width}px`, () => {
      test.use({ viewport: { width, height: width === 360 ? 740 : 844 }, locale: lang.locale, isMobile: true, hasTouch: true });

      test("home screen fits: no horizontal scroll, nothing sticking out or cut off", async ({ page }) => {
        await preferFullMode(page);
        await mockNearbyApi(page);
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("lang", lang.code);
        await expect(page.locator(".hero-tile")).toHaveCount(4);
        await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
        expect(await layoutProblems(page)).toEqual([]);
        await expect(page.locator(".hero-trust")).toContainText(lang.trust);
        if (lang.code === "ar") await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      });

      test("language sheet and urgent list fit", async ({ page }) => {
        await preferFullMode(page);
        await mockNearbyApi(page);
        await grantNycLocation(page);
        await page.goto("/");
        await expect(page.locator(".hero-tile")).toHaveCount(4);
        await page.locator(".header .lang-btn").click();
        await expect(page.locator(".lang-sheet")).toBeVisible();
        expect(await layoutProblems(page)).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(page.locator(".lang-sheet")).toHaveCount(0);
        await page.locator(".bb-emergency").click();
        await expect(page.getByRole("dialog").first()).toBeVisible();
        await page.waitForTimeout(800);
        expect(await layoutProblems(page)).toEqual([]);
      });
    });
  }
}

test.describe("Loading, empty and error states", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  async function openFood(page: Page) {
    await grantNycLocation(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
  }

  test("a skeleton shows while the search is running", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.route(/\/api\/(nearby|organizations)/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_NEARBY_ORGS) });
    });
    await openFood(page);
    await expect(page.locator(".animate-pulse").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".map-panel article").first()).toBeVisible({ timeout: 30_000 });
  });

  test("an empty area says so and offers to widen the search", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.route(/\/api\/(nearby|organizations|verified-nearby)/, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );
    await openFood(page);
    await expect(page.getByTestId("empty-expand")).toBeVisible({ timeout: 30_000 });
  });

  test("a failed load says so and Try again is offered", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.route(/\/api\/(nearby|organizations|verified-nearby)/, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await openFood(page);
    await expect(page.getByTestId("load-retry")).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("Keyboard, focus and motion", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the organization sheet closes on Esc and gives the focus back", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await grantNycLocation(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me/i }).click();
    const title = page.locator(".map-panel article").first().getByRole("button", { name: MOCK_NEARBY_ORGS[0].name });
    await expect(title).toBeVisible({ timeout: 30_000 });
    await title.focus();
    await page.keyboard.press("Enter");
    const sheet = page.getByTestId("org-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("dialog")).toHaveAttribute("aria-labelledby", "os-title");
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(title).toBeFocused();
  });

  test("keyboard focus is visible and icon buttons have names", async ({ page }) => {
    await preferFullMode(page);
    await page.goto("/");
    await expect(page.locator(".hero-tile")).toHaveCount(4);
    // Tab until something real has the focus (the first stops are the logo and the header buttons).
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement !== document.body && document.activeElement !== null)) break;
    }
    const outline = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement as Element);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
    const unnamed = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, a[href]"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .filter((el) => !((el.getAttribute("aria-label") ?? "").trim() || (el.textContent ?? "").trim() || (el.getAttribute("title") ?? "").trim()))
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(unnamed).toEqual([]);
  });

  test("reduced motion switches the animations off", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true });
    const page = await context.newPage();
    await preferFullMode(page);
    await page.goto("/");
    await expect(page.locator(".hero-tile")).toHaveCount(4);
    const durations = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".hero-tile, .hero-cta-main, .bb-item")).map((el) => {
        const cs = getComputedStyle(el);
        return { animation: parseFloat(cs.animationDuration) || 0, transition: parseFloat(cs.transitionDuration) || 0 };
      }),
    );
    for (const d of durations) {
      expect(d.animation).toBeLessThan(0.05);
      expect(d.transition).toBeLessThan(0.05);
    }
    await context.close();
  });
});
