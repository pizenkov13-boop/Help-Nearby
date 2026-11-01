import { test, expect } from "./fixtures";
import { APP_CACHE_VERSION, APP_CACHE_VERSION_KEY } from "@/lib/appCacheVersion";
import {
  parseAcceptLanguage,
  pickSupportedLanguage,
} from "@/lib/i18n/detectLanguage";
import { mockNearbyApi, preferFullMode } from "./helpers";

test.describe("Language detection (unit)", () => {
  test("Accept-Language is ordered by q and matched on the primary subtag", () => {
    expect(parseAcceptLanguage("ja;q=0.9, ru-RU, en;q=0.5")).toEqual(["ru-RU", "ja", "en"]);
    expect(parseAcceptLanguage("*;q=0.1, fr;q=0")).toEqual([]);
    expect(pickSupportedLanguage(["ja", "zh-Hans-CN"])).toBe("zh");
    expect(pickSupportedLanguage(["ja", "ko"])).toBeUndefined();
  });
});

test.describe("Language detection (browser)", () => {
  const cases = [
    { locale: "ru-RU", lang: "ru", dir: "ltr", heading: /Найдите помощь/ },
    { locale: "ar", lang: "ar", dir: "rtl", heading: /اعثر على المساعدة/ },
    { locale: "ja-JP", lang: "en", dir: "ltr", heading: /Find Help Near You/ },
  ];

  for (const c of cases) {
    test(`${c.locale} opens in ${c.lang}, already in the first server-rendered HTML`, async ({
      browser,
      baseURL,
    }) => {
      // Server side: no JavaScript, just the Accept-Language header.
      const ctx = await browser.newContext({
        locale: c.locale,
        baseURL,
        extraHTTPHeaders: { "Accept-Language": c.locale },
      });
      const html = await (await ctx.request.get("/")).text();
      expect(html).toMatch(new RegExp(`<html[^>]*lang="${c.lang}"`));
      expect(html).toMatch(new RegExp(`<html[^>]*dir="${c.dir}"`));
      expect(html).toMatch(c.heading);
      await ctx.close();

      // Browser side: the page stays in that language after hydration.
      const ctx2 = await browser.newContext({ locale: c.locale, baseURL });
      const page = await ctx2.newPage();
      await preferFullMode(page);
      await mockNearbyApi(page);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", c.lang);
      await expect(page.locator("html")).toHaveAttribute("dir", c.dir);
      await expect(page.locator("h1")).toHaveText(c.heading);
      await ctx2.close();
    });
  }

  test("a language picked by hand beats the browser language and is remembered", async ({
    browser,
    baseURL,
  }) => {
    const ctx = await browser.newContext({ locale: "ru-RU", baseURL });
    const page = await ctx.newPage();
    await mockNearbyApi(page);
    // Keep the app-cache marker (production builds reload without it) but, unlike preferFullMode, never clear storage.
    await page.addInitScript(
      ([key, version]) => localStorage.setItem(key, version),
      [APP_CACHE_VERSION_KEY, APP_CACHE_VERSION],
    );
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await page.getByRole("button", { name: /язык/i }).click();
    await page.getByRole("menuitem", { name: "Español" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1")).toHaveText(/Encuentra ayuda/);
    await ctx.close();
  });

  test("with no supported browser language the deployment default is used", async ({
    browser,
    baseURL,
  }) => {
    const ctx = await browser.newContext({
      locale: "ko-KR",
      baseURL,
      extraHTTPHeaders: { "Accept-Language": "ko-KR" },
    });
    const html = await (await ctx.request.get("/")).text();
    expect(html).toMatch(/<html[^>]*lang="en"/);
    await ctx.close();
  });
});
