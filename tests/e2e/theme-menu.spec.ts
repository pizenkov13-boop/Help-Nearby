import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { APP_CACHE_VERSION, APP_CACHE_VERSION_KEY } from "@/lib/appCacheVersion";

const THEME_KEY = "help-nearby-theme";
const LABELS = {
  en: ["Auto", "Light", "Dark"],
  ru: ["Авто", "Светлая", "Тёмная"],
  es: ["Automático", "Clara", "Oscura"],
  fr: ["Automatique", "Claire", "Sombre"],
  de: ["Automatisch", "Hell", "Dunkel"],
  zh: ["自动", "浅色", "深色"],
  ar: ["تلقائي", "فاتح", "داكن"],
} as const;

/**
 * Fresh storage once per tab (a reload keeps what the page saved, unlike preferFullMode which wipes
 * storage on every load), then the page. `country` plays Vercel's x-vercel-ip-country header.
 */
async function openPage(
  page: Page,
  opts: { lang?: string; width?: number; scheme?: "light" | "dark"; country?: string } = {},
) {
  const { lang = "en", width = 390, scheme = "dark", country } = opts;
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width, height: 800 });
  if (country) await page.setExtraHTTPHeaders({ "x-vercel-ip-country": country });
  await page.addInitScript(
    ([l, cacheKey, cacheVersion]) => {
      if (!sessionStorage.getItem("e2e-init")) {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem("e2e-init", "1");
        sessionStorage.setItem("help-nearby-chat-notice", "1");
        localStorage.setItem("help-nearby-view-mode", "full");
        localStorage.setItem(cacheKey, cacheVersion);
      }
      localStorage.setItem("hn-language", l);
    },
    [lang, APP_CACHE_VERSION_KEY, APP_CACHE_VERSION],
  );
  await page.goto("/about");
  await page.waitForFunction((l) => document.documentElement.lang === l, lang);
}

const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains("dark"));
const stored = (page: Page) => page.evaluate((k) => localStorage.getItem(k), THEME_KEY);

async function openMenu(page: Page) {
  await page.locator(".mobile-toggle").click();
  const menu = page.locator("#mmenu");
  await expect(menu).toBeVisible();
  return menu;
}

test.describe("Phone menu: no language block, a labelled theme switch right after the links", () => {
  for (const width of [390, 768, 1023]) {
    test(`${width}px: the language button stays in the header, the menu has no language block`, async ({ page }) => {
      await openPage(page, { width });
      // Another language control outside the burger: the header's own button.
      await expect(page.locator(".header .lang-btn")).toBeVisible();
      const menu = await openMenu(page);
      await expect(menu.locator(".mm-langs, .mm-lang")).toHaveCount(0);
      for (const name of ["English", "Русский", "Español", "Français", "Deutsch", "中文", "العربية"]) {
        await expect(menu.getByRole("button", { name, exact: true })).toHaveCount(0);
      }
    });
  }

  test("the switch sits right after the navigation and is visible without scrolling", async ({ page }) => {
    await openPage(page, { width: 390 });
    const menu = await openMenu(page);
    const group = menu.getByRole("radiogroup", { name: "Theme" });
    await expect(group).toBeVisible();
    const nav = (await menu.locator(".mm-nav").boundingBox())!;
    const box = (await group.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(nav.y + nav.height - 1);
    // The section (its heading and the switch) starts directly under the links, nothing in between.
    const section = (await menu.locator(".mm-section").first().boundingBox())!;
    expect(section.y - (nav.y + nav.height)).toBeLessThan(40);
    await expect(menu.locator(".mm-section")).toHaveCount(1);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    // Three options, every one tall enough to tap.
    for (const name of LABELS.en) {
      const option = group.getByRole("radio", { name, exact: true });
      await expect(option).toBeVisible();
      expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  for (const [lang, names] of Object.entries(LABELS)) {
    test(`${lang}: Auto / Light / Dark come from the translations and fit on one line`, async ({ page }) => {
      await openPage(page, { lang });
      const menu = await openMenu(page);
      const group = menu.locator('[role="radiogroup"]');
      const radios = group.getByRole("radio");
      await expect(radios).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(radios.nth(i)).toHaveText(names[i]!);
        const fits = await radios.nth(i).evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().height < 60);
        expect(fits, `${lang}: ${names[i]} overflows its button`).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});

test.describe("Theme choice is saved and beats Auto", () => {
  test("Dark and Light are saved in localStorage and survive a reload", async ({ page }) => {
    await openPage(page, { scheme: "light" });
    expect(await stored(page)).toBeNull();
    expect(await isDark(page)).toBe(false);

    let menu = await openMenu(page);
    await menu.getByRole("radio", { name: "Dark", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await stored(page)).toBe("dark");
    await expect(menu.getByRole("radio", { name: "Dark", exact: true })).toHaveAttribute("aria-checked", "true");

    await page.reload();
    expect(await isDark(page)).toBe(true);
    menu = await openMenu(page);
    await expect(menu.getByRole("radio", { name: "Dark", exact: true })).toHaveAttribute("aria-checked", "true");

    await menu.getByRole("radio", { name: "Light", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(false);
    expect(await stored(page)).toBe("light");
    await page.reload();
    expect(await isDark(page)).toBe(false);
  });

  test("Auto saves nothing and follows the device outside sunny countries", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "DE" });
    expect(await isDark(page)).toBe(true); // Auto + dark device
    expect(await stored(page)).toBeNull();
    const menu = await openMenu(page);
    await expect(menu.getByRole("radio", { name: "Auto", exact: true })).toHaveAttribute("aria-checked", "true");

    await menu.getByRole("radio", { name: "Light", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(false);
    await menu.getByRole("radio", { name: "Auto", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(true); // back to the device setting
    expect(await stored(page)).toBeNull(); // Auto is "nothing saved", never a stored value
    await page.reload();
    expect(await isDark(page)).toBe(true);
  });

  test("sunny country: Auto starts light even on a dark device, without any browser location request", async ({ page }) => {
    await page.addInitScript(() => {
      const g = navigator.geolocation;
      if (g) g.getCurrentPosition = () => ((window as unknown as { __geo?: number }).__geo = 1) as never;
    });
    await openPage(page, { scheme: "dark", country: "EG" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-auto-theme"))).toBe("light");
    expect(await isDark(page)).toBe(false);
    expect(await stored(page)).toBeNull(); // the automatic choice is not saved as if the user had picked it
    expect(await page.evaluate(() => (window as unknown as { __geo?: number }).__geo ?? 0)).toBe(0);
    const menu = await openMenu(page);
    await expect(menu.getByRole("radio", { name: "Auto", exact: true })).toHaveAttribute("aria-checked", "true");
  });

  test("sunny country: a manual choice always beats Auto, also after a reload", async ({ page }) => {
    await openPage(page, { scheme: "dark", country: "KE" });
    expect(await isDark(page)).toBe(false); // Auto in a sunny country

    let menu = await openMenu(page);
    await menu.getByRole("radio", { name: "Dark", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    expect(await stored(page)).toBe("dark");

    await page.reload(); // same sunny country, same dark device: the saved Dark choice still wins
    expect(await isDark(page)).toBe(true);
    menu = await openMenu(page);
    await expect(menu.getByRole("radio", { name: "Dark", exact: true })).toHaveAttribute("aria-checked", "true");

    await menu.getByRole("radio", { name: "Auto", exact: true }).click();
    await expect.poll(() => isDark(page)).toBe(false); // Auto again: light in a sunny country
    expect(await stored(page)).toBeNull();
    await page.reload();
    expect(await isDark(page)).toBe(false);
  });

  test("sunny country, light device: a saved Dark choice is not overridden", async ({ page }) => {
    await openPage(page, { scheme: "light", country: "SA" });
    await page.evaluate((k) => localStorage.setItem(k, "dark"), THEME_KEY);
    await page.reload();
    expect(await isDark(page)).toBe(true);
  });
});
