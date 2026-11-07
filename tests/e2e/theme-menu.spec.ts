import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { APP_CACHE_VERSION, APP_CACHE_VERSION_KEY } from "@/lib/appCacheVersion";

/**
 * The theme is automatic and has no switch: light for visitors from a SUNNY_COUNTRY_CODES country
 * (Vercel's x-vercel-ip-country header), otherwise the device setting (prefers-color-scheme).
 */
const LEGACY_THEME_KEY = "help-nearby-theme";

async function openPage(
  page: Page,
  opts: { width?: number; scheme?: "light" | "dark"; country?: string; legacy?: string } = {},
) {
  const { width = 390, scheme = "dark", country, legacy } = opts;
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width, height: 800 });
  if (country) await page.setExtraHTTPHeaders({ "x-vercel-ip-country": country });
  await page.addInitScript(
    ([old, cacheKey, cacheVersion]) => {
      if (!sessionStorage.getItem("e2e-init")) {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem("e2e-init", "1");
        sessionStorage.setItem("help-nearby-chat-notice", "1");
        localStorage.setItem("help-nearby-view-mode", "full");
        localStorage.setItem(cacheKey, cacheVersion);
        if (old) localStorage.setItem("help-nearby-theme", old);
      }
    },
    [legacy ?? "", APP_CACHE_VERSION_KEY, APP_CACHE_VERSION],
  );
  await page.goto("/about");
  await page.waitForSelector(".header-inner");
}

const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains("dark"));

test.describe("No theme switch anywhere", () => {
  for (const width of [390, 768, 1023, 1024, 1440]) {
    test(`${width}px: the header has no theme button`, async ({ page }) => {
      await openPage(page, { width });
      await expect(page.locator(".header .theme-btn, .header .lucide-sun, .header .lucide-moon")).toHaveCount(0);
      await expect(page.locator(".header").getByRole("button", { name: /theme|dark mode|light mode|тем/i })).toHaveCount(0);
      // The language button is still there.
      await expect(page.locator(".header .lang-btn")).toBeVisible();
    });
  }

  for (const width of [390, 768, 1023]) {
    test(`${width}px: the burger menu has no theme switch and no language block`, async ({ page }) => {
      await openPage(page, { width });
      await page.locator(".mobile-toggle").click();
      const menu = page.locator("#mmenu");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("radiogroup")).toHaveCount(0);
      await expect(menu.getByRole("radio")).toHaveCount(0);
      await expect(menu.locator(".theme-switch, .theme-btn, .mm-section, .mm-langs")).toHaveCount(0);
      for (const name of ["Auto", "Light", "Dark", "English", "Русский"]) {
        await expect(menu.getByRole("button", { name, exact: true })).toHaveCount(0);
      }
      // The menu itself still works: its links are there.
      await expect(menu.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    });
  }
});

test.describe("Sunny countries: always light", () => {
  for (const country of ["EG", "KE", "SA"]) {
    test(`${country}: light even when the device is dark`, async ({ page }) => {
      await openPage(page, { scheme: "dark", country });
      expect(await page.evaluate(() => document.documentElement.getAttribute("data-auto-theme"))).toBe("light");
      expect(await isDark(page)).toBe(false);
      expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("light");
    });
  }

  test("the country header is case-insensitive", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "eg" });
    expect(await isDark(page)).toBe(false);
  });

  test("light is applied before the first paint, with no page script running", async ({ page }) => {
    // Every Next.js chunk is blocked, so only public/theme-init.js can have set the class.
    await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort());
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "EG" });
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    expect(await isDark(page)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("light");
  });

  test("stays light when the device setting changes while the page is open", async ({ page }) => {
    await openPage(page, { scheme: "light", country: "KE" });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(300);
    expect(await isDark(page)).toBe(false);
  });
});

test.describe("Everywhere else: the device decides", () => {
  test("Germany, dark device: dark", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "DE" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-auto-theme"))).toBeNull();
    expect(await isDark(page)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("dark");
  });

  test("Germany, light device: light", async ({ page }) => {
    await openPage(page, { scheme: "light", country: "DE" });
    expect(await isDark(page)).toBe(false);
  });

  test("Germany: follows the device setting when it changes while the page is open", async ({ page }) => {
    await openPage(page, { scheme: "light", country: "DE" });
    expect(await isDark(page)).toBe(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => isDark(page)).toBe(false);
  });

  test("no country header at all: the device decides", async ({ page }) => {
    await openPage(page, { scheme: "dark" });
    expect(await isDark(page)).toBe(true);
  });

  test("Germany, dark device, before any page script: dark", async ({ page }) => {
    await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort());
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "DE" });
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    expect(await isDark(page)).toBe(true);
  });
});

test.describe("The old saved choice no longer matters", () => {
  test("a saved \"dark\" is ignored on a light device and the old key is removed", async ({ page }) => {
    await openPage(page, { scheme: "light", country: "DE", legacy: "dark" });
    expect(await isDark(page)).toBe(false);
    expect(await page.evaluate((k) => localStorage.getItem(k), LEGACY_THEME_KEY)).toBeNull();
  });

  test("a saved \"light\" is ignored on a dark device", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "DE", legacy: "light" });
    expect(await isDark(page)).toBe(true);
    expect(await page.evaluate((k) => localStorage.getItem(k), LEGACY_THEME_KEY)).toBeNull();
  });

  test("a saved \"dark\" does not beat a sunny country", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "EG", legacy: "dark" });
    expect(await isDark(page)).toBe(false);
  });

  test("a saved \"system\" is just removed", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "DE", legacy: "system" });
    expect(await isDark(page)).toBe(true);
    expect(await page.evaluate((k) => localStorage.getItem(k), LEGACY_THEME_KEY)).toBeNull();
  });
});
