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

  test("Why it matters: sourced figures show their source, the unsourced one does not", async ({ page }) => {
    await open(page, "en", "/why-it-matters");
    const sources = page.getByTestId("stat-source");
    await expect(sources).toHaveCount(2);
    await expect(sources.nth(0)).toContainText("World Bank");
    await expect(sources.nth(0)).toContainText("2024");
    await expect(sources.nth(1)).toContainText("SOFI 2025");
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
