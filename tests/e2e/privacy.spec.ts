import { test, expect } from "./fixtures";
import { LANGUAGES } from "@/lib/i18n/translations";
import { PRIVACY_COPY } from "@/components/pages/PrivacyContent";
import { mockNearbyApi, preferFullMode } from "./helpers";

const THIRD_PARTIES = [
  "tile.openstreetmap.org",
  "Nominatim",
  "Overpass",
  "OSRM",
  "api.aitunnel.ru",
  "Supabase",
];

// "uses no cookies" in every interface language
const NO_COOKIES: Record<string, string> = {
  en: "uses no cookies and no personal identifiers",
  ru: "Не использует cookie и персональные идентификаторы",
  es: "No usa cookies ni identificadores personales",
  fr: "n'utilise ni cookies ni identifiants personnels",
  de: "verwendet keine Cookies und keine persönlichen Kennungen",
  zh: "不使用 Cookie，也不使用个人标识符",
  ar: "لا تستخدم ملفات تعريف الارتباط ولا معرّفات شخصية",
};

// "aggregated counts of visits, pages and countries"
const AGGREGATED: Record<string, string> = {
  en: "aggregated counts of visits, pages and countries",
  ru: "агрегированные счётчики посещений, страниц и стран",
  es: "recuentos agregados de visitas, páginas y países",
  fr: "décomptes agrégés des visites, des pages et des pays",
  de: "aggregierte Zahlen zu Besuchen, Seiten und Ländern",
  zh: "访问量、页面和国家的汇总统计",
  ar: "أعداد مجمّعة للزيارات والصفحات والدول",
};

const VERCEL_LINE = /^Vercel Web Analytics\s*[（(]/;

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

  test("English: analytics is Vercel Web Analytics, not Umami", async ({ page }) => {
    await page.goto("/privacy");
    const content = page.getByTestId("privacy-page");

    await expect(content).toContainText("Vercel Web Analytics");
    await expect(content).toContainText("uses no cookies and no personal identifiers");
    await expect(content).toContainText("aggregated counts of visits, pages and countries");
    await expect(content).toContainText("without any query string");
    await expect(content).not.toContainText(/umami/i);
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

  for (const { code } of LANGUAGES) {
    test(`${code}: translated, names Vercel Web Analytics (no cookies, no identifiers, aggregated) and no Umami`, async ({
      page,
    }) => {
      await page.addInitScript((lang) => localStorage.setItem("hn-language", lang), code);
      await page.goto("/privacy");
      const content = page.getByTestId("privacy-page");

      await expect(content).toContainText(PRIVACY_COPY[code].sections[0]!.title);
      await expect(content).toContainText("Vercel Web Analytics");
      await expect(content).toContainText(NO_COOKIES[code]!);
      await expect(content).toContainText(AGGREGATED[code]!);
      await expect(content).toContainText("/_vercel/insights");
      await expect(content).not.toContainText(/umami/i);
      await expect(page.getByTestId("privacy-contact-email")).toHaveAttribute(
        "href",
        "mailto:hello@help-nearby.org",
      );
      await expect(page.getByTestId("footer-contact-email")).toHaveAttribute(
        "href",
        "mailto:hello@help-nearby.org",
      );
      for (const name of THIRD_PARTIES) await expect(content).toContainText(name);
      if (code !== "en") {
        await expect(content).not.toContainText("Vercel Web Analytics (requests go to our own domain");
      }
    });
  }

  test("every language has the same structure as English, one Vercel Web Analytics item and no Umami", () => {
    const en = PRIVACY_COPY.en;
    for (const { code } of LANGUAGES) {
      const copy = PRIVACY_COPY[code];
      expect(copy.sections.map((s) => s.items?.length ?? 0), code).toEqual(
        en.sections.map((s) => s.items?.length ?? 0),
      );
      expect(copy.sections.map((s) => s.paragraphs?.length ?? 0), code).toEqual(
        en.sections.map((s) => s.paragraphs?.length ?? 0),
      );

      const items = copy.sections.flatMap((s) => s.items ?? []);
      expect(items.filter((i) => VERCEL_LINE.test(i)), code).toHaveLength(1);
      expect(copy.sections[0]!.items![1], code).toContain("Vercel Web Analytics");
      expect(JSON.stringify(copy), code).not.toMatch(/umami/i);
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
    expect(await res.text()).toContain("https://www.help-nearby.org/privacy</loc>");
  });
});
