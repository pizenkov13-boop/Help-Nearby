import { test, expect } from "./fixtures";
import { LANGUAGES, translations } from "@/lib/i18n/translations";

/** First open of the chat in a tab: a short notice, acknowledged once and remembered in sessionStorage. */
test.describe("Chat first-open notice", () => {
  test.skip(process.env.E2E_REGION_BLOCK === "1", "the chat is switched off in the region run");

  test("shown at the first open, acknowledged once, then not again in the same tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "AI Assistant" }).click();

    const notice = page.getByTestId("chat-first-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(
      "Messages are passed to a third-party AI service. Do not write your name, phone number, address or other personal data.",
    );

    await notice.getByRole("button", { name: "Got it" }).click();
    await expect(notice).toBeHidden();
    await expect(page.locator(".fixed.bottom-24").locator('input[type="text"]')).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("help-nearby-chat-notice"))).toBe("1");

    // Closing and opening again, and reloading the same tab: no second notice.
    await page.reload();
    await page.getByRole("button", { name: "AI Assistant" }).click();
    await expect(page.locator(".fixed.bottom-24").locator('input[type="text"]')).toBeVisible();
    await expect(page.getByTestId("chat-first-notice")).toHaveCount(0);
  });

  test("a new tab (empty sessionStorage) shows the notice again", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "AI Assistant" }).click();
    await expect(page.getByTestId("chat-first-notice")).toBeVisible();
    await context.close();
  });

  test("the notice and its button exist in all 7 languages, with the Russian text as specified", () => {
    for (const { code } of LANGUAGES) {
      expect(translations[code].chatFirstNotice?.length, code).toBeGreaterThan(20);
      expect(translations[code].chatFirstNoticeOk?.length, code).toBeGreaterThan(1);
    }
    expect(translations.ru.chatFirstNotice).toBe(
      "Сообщения передаются стороннему ИИ-сервису. Не пишите имя, телефон, адрес и другие личные данные.",
    );
    expect(translations.ru.chatFirstNoticeOk).toBe("Понятно");
  });
});
