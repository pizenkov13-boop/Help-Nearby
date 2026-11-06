import { test, expect } from "./fixtures";

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

  test("admin page shows login when not authenticated", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /Admin/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
  });
});
