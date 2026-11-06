import { test, expect } from "./fixtures";
import { preferFullMode } from "./helpers";

test.describe("Forms", () => {
  test("submit page shows validation on empty submit", async ({ page }) => {
    await page.goto("/submit");

    await expect(page.getByRole("heading", { name: /Submit an Organization/i })).toBeVisible();

    await page.getByRole("button", { name: /Submit Organization/i }).click();

    await expect(page.locator("input:invalid, textarea:invalid").first()).toBeVisible();
  });

  test("reviews page loads form and list section", async ({ page }) => {
    await page.goto("/reviews");

    await expect(page.getByRole("heading", { name: /Reviews/i })).toBeVisible();
    await expect(page.getByLabel("Name or nickname (optional)")).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit feedback/i })).toBeVisible();
  });

  test("free-text fields warn against personal data; the organization form asks for work contacts only", async ({ page }) => {
    await page.goto("/reviews");
    await expect(page.getByTestId("personal-data-warning")).toContainText("Write public information only");

    await page.goto("/submit");
    await expect(page.getByTestId("personal-data-warning")).toContainText("Write public information only");
    await expect(page.getByTestId("work-contacts-hint")).toHaveText("Only the organization's work contacts.");

    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "Русский" }).click();
    await expect(page.getByTestId("work-contacts-hint")).toHaveText("Только рабочие контакты организации.");
    await expect(page.getByTestId("personal-data-warning")).toContainText("пишите только публичную информацию");
  });

  test("privacy page states the 30-minute cache, the in-memory IP and the hosting logs", async ({ page }) => {
    await page.goto("/privacy");
    const text = await page.locator("main").innerText();
    expect(text).toContain("for 30 minutes");
    expect(text).not.toContain("for one hour");
    expect(text).toContain("kept in the server's memory");
    expect(text).toContain("the URL of each request");
    expect(text).toContain("hosting provider's logs may contain it");
  });

  test("a review whose country has no flag file shows the globe, never a broken image", async ({ page, request }) => {
    expect((await request.get("/flags/ua.svg")).status()).toBe(404);

    await page.route(/\/api\/reviews/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 1, name: "Test", country: "UA", message: "No flag file for this code", rating: 5, approved: true, created_at: "2026-01-01T00:00:00Z" },
        ]),
      }),
    );
    await page.goto("/reviews");
    const card = page.locator("article").filter({ hasText: "No flag file for this code" });
    await expect(card).toBeVisible();
    await expect(card.locator('img[src="/flags/ua.svg"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(card.locator("svg.lucide-globe")).toBeVisible();
  });

  test("/submit, the reviews form and the footer are translated in all 7 languages", async ({ page }) => {
    const cases = [
      { code: "en", title: "Submit an Organization", button: "Submit Organization", details: "Organization details", stars: "5 stars", sdg: "UN Sustainable Development Goal 1: No Poverty" },
      { code: "ru", title: "Добавить организацию", button: "Отправить организацию", details: "Данные организации", stars: "Оценка: 5", sdg: "Цель ООН в области устойчивого развития 1: Ликвидация нищеты" },
      { code: "es", title: "Añadir una organización", button: "Enviar organización", details: "Datos de la organización", stars: "5 estrellas", sdg: "Objetivo de Desarrollo Sostenible de la ONU 1: Fin de la pobreza" },
      { code: "fr", title: "Ajouter une organisation", button: "Envoyer l'organisation", details: "Informations sur l'organisation", stars: "5 étoiles", sdg: "Objectif de développement durable de l'ONU 1 : Pas de pauvreté" },
      { code: "de", title: "Organisation hinzufügen", button: "Organisation einreichen", details: "Angaben zur Organisation", stars: "5 Sterne", sdg: "UN-Ziel für nachhaltige Entwicklung 1: Keine Armut" },
      { code: "zh", title: "提交机构", button: "提交机构", details: "机构信息", stars: "5 星", sdg: "联合国可持续发展目标 1：无贫穷" },
      { code: "ar", title: "إضافة منظمة", button: "إرسال المنظمة", details: "بيانات المنظمة", stars: "5 نجوم", sdg: "هدف الأمم المتحدة للتنمية المستدامة 1: القضاء على الفقر" },
    ];
    for (const c of cases) {
      await page.addInitScript((code) => localStorage.setItem("hn-language", code), c.code);
      await page.goto("/submit");
      await expect(page.getByRole("heading", { level: 1 }), c.code).toHaveText(c.title);
      await expect(page.getByText(c.details, { exact: true }), c.code).toBeVisible();
      await expect(page.getByRole("button", { name: c.button, exact: true }), c.code).toBeVisible();
      await expect(page.locator('img[alt="' + c.sdg + '"]'), c.code).toHaveCount(1);

      await page.goto("/reviews");
      await expect(page.getByRole("button", { name: c.stars, exact: true }), c.code).toBeVisible();
    }
  });

  test("admin page shows login when not authenticated", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /Admin/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
  });

  test("a normal visitor sees the links to both forms (header, footer)", async ({ page }) => {
    await preferFullMode(page);
    await page.goto("/");
    await expect(page.locator('.nav a[href="/reviews"]')).toHaveCount(1);
    await expect(page.locator('footer a[href="/reviews"]')).toHaveCount(1);
    await expect(page.locator('footer a[href="/submit"]')).toHaveCount(1);
  });
});
