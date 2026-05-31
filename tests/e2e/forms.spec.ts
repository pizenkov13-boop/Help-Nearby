import { test, expect } from "@playwright/test";

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
    await expect(page.getByLabel("Your name")).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit feedback/i })).toBeVisible();
  });

  test("admin page shows login when not authenticated", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /Admin/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
  });
});
