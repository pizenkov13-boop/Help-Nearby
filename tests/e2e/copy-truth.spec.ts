import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { translations } from "@/lib/i18n/translations";
import { preferFullMode } from "./helpers";

async function open(page: Page, lang: string, path: string) {
  await preferFullMode(page);
  await page.addInitScript((l) => localStorage.setItem("hn-language", l), lang);
  await page.goto(path);
  await page.waitForFunction((l) => document.documentElement.lang === l, lang);
}

test.describe("Claims on the site match what the code does", () => {
  test("no language promises an offline mode (the app does not work without a network)", () => {
    const offline = /offline|офлайн|оффлайн|hors ligne|sin conexión|离线|دون اتصال/i;
    for (const code of ["en", "ru", "es", "fr", "de", "zh", "ar"] as const) {
      expect(translations[code].whySolution3Text, code).not.toMatch(offline);
      expect(translations[code].whySolutionCard3Text, code).not.toMatch(offline);
    }
  });

  test("the home cards do not say 'verified' or 'wherever you are' (ru)", () => {
    const t = translations.ru;
    expect(t.aboutGetHelpCardText).toBe("Сразу звоните или получайте маршрут до пунктов помощи.");
    expect(t.aboutValuesCard3Text).toBe("Показываем пункты помощи в разных странах мира.");
    expect(t.howItWorksStep3Description).toBe("Позвоните одним касанием или постройте маршрут.");
  });

  test("Why it matters: every figure shows its source and year", async ({ page }) => {
    await open(page, "en", "/why-it-matters");
    const sources = page.getByTestId("stat-source");
    await expect(sources).toHaveCount(3);
    await expect(sources.nth(0)).toContainText("World Bank");
    await expect(sources.nth(0)).toContainText("2024");
    await expect(sources.nth(1)).toContainText("UN-Habitat");
    await expect(sources.nth(1)).toContainText("2025");
    await expect(sources.nth(2)).toContainText("SOFI 2025");
    await expect(page.locator(".stat-card .v").nth(1)).toHaveText("318M");
  });

  test("the solution cards and the hero make no claims the code does not back (ru)", () => {
    const t = translations.ru;
    expect(t.whySolution2Title).toBe("Часы работы и контакты");
    expect(t.whySolution3Title).toBe("Доступно на любом устройстве");
    expect(t.whySolution3Text).toBe("7 языков и лёгкий режим для медленного интернета.");
    expect(t.verified).toBe("Открытые источники");
  });

  test("no language uses the words verified / trusted / everywhere / real-time for the catalog", () => {
    const risky = /verified|trusted|everywhere|wherever|anywhere|real-?time|instant|проверенн|везде|где бы вы|в реальном времени|доверенн|мгновенн/i;
    const keys = [
      "heroSubtitle", "howItWorksStep1Description", "howItWorksStep2Description", "recentSubtitle", "aboutMissionText",
      "aboutVisionText", "whyCard2Text", "metaRecentDesc", "verified", "noVerifiedNearby", "verifiedOnlyNotice",
      "osmUnavailableNotice", "catalogUnavailableNotice", "whyPageSubtitle", "whySolution1Title", "whySolution2Title",
      "whySolution2Text", "whySolution3Title", "whySolutionCard2Title", "whySolutionCard3Title", "footerTagline",
      "aboutPageSubtitle", "aboutSubtitle", "aboutValuesText", "whySolution1Text",
    ] as const;
    for (const code of ["en", "ru", "es", "fr", "de", "zh", "ar"] as const) {
      for (const key of keys) expect(translations[code][key], `${code}.${key}`).not.toMatch(risky);
    }
  });

  test("the route text does not promise turn-by-turn steps (the route has none)", () => {
    expect(translations.en.howItWorksStep3Description).not.toMatch(/turn-by-turn/i);
    expect(translations.es.howItWorksStep3Description).not.toMatch(/paso a paso/i);
  });

  for (const [lang, names] of [
    ["ru", ["Судан", "Газа, Палестина", "Йемен", "Армения", "Кыргызстан", "Таджикистан"]],
    ["es", ["Sudán", "Gaza, Palestina", "Yemen", "Armenia", "Kirguistán", "Tayikistán"]],
    ["ar", ["السودان", "غزة، فلسطين", "اليمن", "أرمينيا", "قيرغيزستان", "طاجيكستان"]],
  ] as const) {
    test(`Cities in need: place names are translated (${lang})`, async ({ page }) => {
      await open(page, lang, "/why-it-matters");
      const cards = page.locator(".city-card h3");
      await expect(cards).toHaveCount(6);
      for (const [i, name] of names.entries()) await expect(cards.nth(i)).toContainText(name);
      const headings = await cards.allTextContents();
      expect(headings.join(" ")).not.toMatch(/Sudan|Tajikistan|Kyrgyzstan/);
    });
  }

  for (const lang of ["en", "ru"]) {
    test(`Emergency window has a title and no subtitle line (${lang})`, async ({ page }) => {
      await open(page, lang, "/");
      const dialog = page.getByRole("dialog");
      // The first click can land before React has hydrated the page: retry until the window opens.
      await expect(async () => {
        await page.getByRole("button", { name: /Emergency Help|Экстренная помощь/ }).first().click();
        await expect(dialog.getByRole("heading", { name: /24\/7/ })).toBeVisible({ timeout: 1500 });
      }).toPass({ timeout: 20_000 });
      await expect(dialog).not.toContainText(/Call immediately|Звоните немедленно|nearest help first|ближайшая помощь первой/i);
    });
  }
});
