import { test, expect } from "@playwright/test";
import { LANGUAGES } from "@/lib/i18n/translations";
import { PRIVACY_COPY } from "@/components/pages/PrivacyContent";
import { mockNearbyApi, preferFullMode } from "./helpers";

const THIRD_PARTIES = [
  "tile.openstreetmap.org",
  "Nominatim",
  "Overpass",
  "OSRM",
  "api.aitunnel.ru",
  "Umami",
  "Supabase",
];

test.describe("Privacy page", () => {
  test("English: the promises and every third-party service are listed", async ({ page }) => {
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");
    await expect(content).toBeVisible();

    await expect(content).toContainText("No accounts");
    await expect(content).toContainText("No tracking cookies");
    await expect(content).toContainText("not saved in our database");
    for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
    await expect(content).toContainText("Review:");
    await expect(content).toContainText("Add an organization:");
  });

  test("English: Umami Cloud is named honestly (third party, outside Russia, no cookies, no data in events)", async ({
    page,
  }) => {
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");

    await expect(content).toContainText("Umami Cloud (cloud.umami.is)");
    await expect(content).toContainText("not by our own servers");
    await expect(content).toContainText("processed on Umami's servers outside Russia");
    await expect(content).toContainText("No cookies are used");
    await expect(content).toContainText("no coordinates, no search text and nothing you type");
    await expect(content).not.toContainText(/self-hosted/i);
  });

  test("Russian interface language shows the Russian text", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hn-language", "ru"));
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");
    await expect(content).toContainText("Нет аккаунтов");
    await expect(content).toContainText("Нет отслеживающих cookie");
    await expect(content).toContainText("не сохраняется");
    for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
    await expect(content).toContainText("Отзыв:");
    await expect(content).toContainText("Добавление организации:");
  });

  test("Russian: Umami Cloud is named honestly (сторонний сервис, за пределами России, без cookie, без данных в событиях)", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("hn-language", "ru"));
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");

    await expect(content).toContainText("Umami Cloud (cloud.umami.is)");
    await expect(content).toContainText("а не наши собственные серверы");
    await expect(content).toContainText("на серверах Umami за пределами России");
    await expect(content).toContainText("Cookie не используются");
    await expect(content).toContainText("ни координат, ни текста поиска, ни того, что вы вводите");
    await expect(content).not.toContainText(/self-hosted|на собственном сервере/i);
  });

  // Chinese typography uses full-width brackets
  const UMAMI_CLOUD_LINE = /Umami Cloud\s*[（(]cloud\.umami\.is[）)]/;

  // "processed outside Russia" in every interface language
  const OUTSIDE_RUSSIA: Record<string, string> = {
    en: "outside Russia",
    ru: "за пределами России",
    es: "fuera de Rusia",
    fr: "en dehors de la Russie",
    de: "außerhalb Russlands",
    zh: "俄罗斯境外",
    ar: "خارج روسيا",
  };

  for (const { code } of LANGUAGES) {
    test(`${code}: the page is translated and names Umami Cloud as a third party outside Russia`, async ({
      page,
    }) => {
      await page.addInitScript((lang) => localStorage.setItem("hn-language", lang), code);
      await page.goto("/privacy");
      const content = page.getByTestId("privacy-page");

      await expect(content).toContainText(PRIVACY_COPY[code].sections[0]!.title);
      await expect(content).toContainText(UMAMI_CLOUD_LINE);
      await expect(content).toContainText(OUTSIDE_RUSSIA[code]!);
      await expect(content).not.toContainText(/self-hosted/i);
      for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
      if (code !== "en") {
        // not the English fallback
        await expect(content).not.toContainText("Umami Cloud (cloud.umami.is): our visit statistics");
      }
    });
  }

  test("every language has the same sections and list lengths as English and mentions Umami Cloud once", () => {
    const en = PRIVACY_COPY.en;
    for (const { code } of LANGUAGES) {
      const copy = PRIVACY_COPY[code];
      expect(copy.sections.map((s) => s.items?.length ?? 0), code).toEqual(
        en.sections.map((s) => s.items?.length ?? 0),
      );
      expect(copy.sections.map((s) => s.paragraphs?.length ?? 0), code).toEqual(
        en.sections.map((s) => s.paragraphs?.length ?? 0),
      );

      const umami = copy.sections.flatMap((s) => s.items ?? []).filter((i) => UMAMI_CLOUD_LINE.test(i) && i.startsWith("Umami Cloud"));
      expect(umami, code).toHaveLength(1);
      expect(umami[0], code).toContain(OUTSIDE_RUSSIA[code]!);
      expect(copy.sections[0]!.items![1], code).toContain("Umami Cloud");
    }
  });

  test("the footer links to it", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.goto("/about");
    await page.locator("footer").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByTestId("privacy-page")).toBeVisible();
  });

  test("it is listed in the sitemap", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(await res.text()).toContain("https://help-nearby.org/privacy</loc>");
  });
});
