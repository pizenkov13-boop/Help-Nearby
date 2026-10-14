import { test, expect } from "@playwright/test";
import { preferFullMode } from "./helpers";

let lastChatRequest: {
  language?: string;
  messages?: { role: string; content: string }[];
  context?: { organizations?: unknown[] };
} | null = null;

test.describe("Chat widget", () => {
  test.beforeEach(async ({ page }) => {
    await preferFullMode(page);

    // The AI endpoint is always mocked: tests never reach the real provider.
    await page.route(/\/api\/chat/, async (route) => {
      lastChatRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "Here are food organizations near New York:\n• E2E Test Food Bank — 0.5 mi\n• Community Kitchen — volunteer support",
        }),
      });
    });
  });

  test("opens, sends message, receives reply", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "AI Assistant" }).click();

    const panel = page.locator(".fixed.bottom-24");
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/help you find/i)).toBeVisible();

    const input = panel.locator('input[type="text"]');
    await input.fill("food in New York");
    await panel.getByLabel("Send").click();

    await expect(
      panel.locator(".ml-auto").filter({ hasText: "food in New York" }),
    ).toBeVisible();

    await expect(panel.getByText(/typing|Typing/i)).toBeHidden({ timeout: 45_000 });

    const reply = panel
      .locator(".rounded-xl")
      .filter({ hasText: /E2E Test Food Bank|food organizations near New York/i })
      .last();
    await expect(reply).toBeVisible({ timeout: 10_000 });
    expect((await reply.textContent())?.length ?? 0).toBeGreaterThan(20);

    await expect(panel.getByText(/AI can make mistakes/i)).toBeVisible();
    expect(lastChatRequest?.language).toBe("en");
    expect(lastChatRequest?.messages?.at(-1)?.content).toBe("food in New York");
    expect(Array.isArray(lastChatRequest?.context?.organizations)).toBe(true);

    await panel.getByLabel("Close chat").click();
    await expect(panel).toBeHidden();
  });

  test("shows localized welcome and disclaimer in Russian", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /language/i }).click();
    await page.getByRole("menuitem", { name: "RU" }).click();
    await page.getByRole("button", { name: "ИИ-помощник" }).click();

    const panel = page.locator(".fixed.bottom-24");
    await expect(panel.getByText(/помощник Help Nearby/i)).toBeVisible();
    await expect(panel.getByText(/ИИ может ошибаться/)).toBeVisible();
  });
});
