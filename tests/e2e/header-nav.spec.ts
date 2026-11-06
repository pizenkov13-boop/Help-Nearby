import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { preferFullMode } from "./helpers";

const LANGUAGES = ["en", "ru", "es", "fr", "de", "zh", "ar"] as const;
const DESKTOP_WIDTHS = [1024, 1280, 1440, 1920];
const BURGER_WIDTHS = [390, 768, 900, 1023];

async function open(page: Page, lang: string, width: number, mode: "full" | "lite" = "full") {
  await page.setViewportSize({ width, height: 900 });
  await preferFullMode(page); // clears storage first, so the language is set after it
  await page.addInitScript(
    ([l, m]) => {
      localStorage.setItem("hn-language", l);
      localStorage.setItem("help-nearby-view-mode", m);
    },
    [lang, mode],
  );
  await page.goto("/about");
  await page.waitForFunction((l) => document.documentElement.lang === l, lang);
  await page.waitForSelector(".header-inner");
  await page.evaluate(() => document.fonts.ready);
}

/** Two horizontal ranges do not overlap (works the same left-to-right and right-to-left). */
const apart = (a: number[], b: number[]) => a[1] <= b[0] + 1 || b[1] <= a[0] + 1;

/** Geometry of the header, measured in the page. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element) => el.getBoundingClientRect();
    const header = document.querySelector(".header") as HTMLElement;
    const items = [
      ...document.querySelectorAll<HTMLElement>(
        ".nav > .nav-emergency, .nav > .nav-link, .nav > .nav-dd > a.nav-link",
      ),
    ].map((el) => {
      const r = rect(el);
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const style = getComputedStyle(el);
      const textHeight = r.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      // Lines of text: the distinct vertical positions of the text's own line boxes.
      const range = document.createRange();
      range.selectNodeContents(el);
      const tops = new Set([...range.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top)));
      return {
        textLines: tops.size,
        text: el.textContent?.trim() ?? "",
        height: r.height,
        textHeight,
        fontSize: fs,
        centerY: r.top + r.height / 2,
        left: r.left,
        right: r.right,
      };
    });
    const nav = document.querySelector(".nav");
    return {
      headerHeight: rect(header).height,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      navDisplay: nav ? getComputedStyle(nav).display : "none",
      items,
      navBox: nav ? [rect(nav).left, rect(nav).right] : [0, 0],
      brandBox: [rect(document.querySelector(".brand")!).left, rect(document.querySelector(".brand")!).right],
      toolbarBox: [
        rect(document.querySelector(".header-toolbar")!).left,
        rect(document.querySelector(".header-toolbar")!).right,
      ],
    };
  });
}

test.describe("Header menu on desktop: one line, one height, no overflow", () => {
  for (const lang of LANGUAGES) {
    for (const width of DESKTOP_WIDTHS) {
      test(`${lang} at ${width}px`, async ({ page }) => {
        await open(page, lang, width);
        const m = await measure(page);

        expect(m.navDisplay).not.toBe("none");
        expect(m.items.length).toBeGreaterThanOrEqual(5);

        // The header keeps its fixed height (72px) and the page does not scroll sideways.
        expect(m.headerHeight).toBe(72);
        expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);

        // Every item is a single line of text: its text box is one line tall, and the labels do not wrap.
        for (const item of m.items) {
          expect(item.textLines, `"${item.text}" wraps`).toBe(1);
        }
        // All items are vertically centred on the same line.
        const centers = m.items.map((i) => i.centerY);
        expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(2);

        // The emergency button is not taller than the other items.
        const [emergency, ...links] = m.items; // the emergency button is the first item of the nav
        expect(emergency.height).toBeLessThanOrEqual(Math.max(...links.map((i) => i.height)) + 1);

        // Nothing leaves the screen, and the nav does not run under the brand or the toolbar.
        for (const item of m.items) {
          expect(item.left).toBeGreaterThanOrEqual(0);
          expect(item.right).toBeLessThanOrEqual(m.innerWidth);
        }
        // Items stay inside the nav box and never overlap each other, the brand or the toolbar.
        for (const item of m.items) {
          expect(item.left, `"${item.text}" sticks out of the nav`).toBeGreaterThanOrEqual(m.navBox[0] - 1);
          expect(item.right, `"${item.text}" sticks out of the nav`).toBeLessThanOrEqual(m.navBox[1] + 1);
        }
        const sorted = [...m.items].sort((a, b) => a.left - b.left);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].left, `"${sorted[i].text}" overlaps its neighbour`).toBeGreaterThanOrEqual(sorted[i - 1].right - 1);
        }
        expect(apart(m.navBox, m.brandBox), "nav overlaps the brand").toBe(true);
        expect(apart(m.navBox, m.toolbarBox), "nav overlaps the toolbar").toBe(true);
        expect(m.toolbarBox[0]).toBeGreaterThanOrEqual(0);
        expect(m.toolbarBox[1]).toBeLessThanOrEqual(m.innerWidth);
      });
    }
  }

  test("the same header height in every language (1280px)", async ({ page }) => {
    const heights = new Set<number>();
    for (const lang of LANGUAGES) {
      await open(page, lang, 1280);
      heights.add((await measure(page)).headerHeight);
    }
    expect([...heights]).toEqual([72]);
  });

  test("lite mode keeps the same header (ru, 1280px)", async ({ page }) => {
    await open(page, "ru", 1280, "lite");
    const m = await measure(page);
    expect(m.headerHeight).toBe(72);
    expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
    for (const item of m.items) expect(item.textLines, `"${item.text}" wraps`).toBe(1);
  });
});

test.describe("Header on tablet and phone: burger, no overflow", () => {
  for (const lang of LANGUAGES) {
    for (const width of BURGER_WIDTHS) {
      test(`${lang} at ${width}px`, async ({ page }) => {
        await open(page, lang, width);
        const m = await measure(page);
        expect(m.navDisplay).toBe("none");
        expect(m.headerHeight).toBe(72);
        expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
        expect(m.toolbarBox[0]).toBeGreaterThanOrEqual(0);
        expect(m.toolbarBox[1]).toBeLessThanOrEqual(m.innerWidth);
        expect(apart(m.toolbarBox, m.brandBox), "toolbar overlaps the brand").toBe(true);

        const burger = page.locator(".mobile-toggle");
        await expect(burger).toBeVisible();
        const box = (await burger.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(40);
        await burger.click();
        const menu = page.locator("#mmenu");
        await expect(menu).toBeVisible();
        // The open menu does not make the page scroll sideways either.
        const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        expect(sw[0]).toBeLessThanOrEqual(sw[1]);
      });
    }
  }
});

test("phone: the emergency button is at least 44px tall and the header does not grow (390px)", async ({ page }) => {
  await open(page, "ru", 390);
  // On the home page the phone bottom bar carries the emergency button; elsewhere the header icon does.
  const urgent = page.locator(".emergency-icon-btn:visible, .bottom-bar button:visible").first();
  await expect(urgent).toBeVisible();
  const box = (await urgent.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect((await measure(page)).headerHeight).toBe(72);
});
