import { test, expect, type Page } from "@playwright/test";
import { translations } from "@/lib/i18n/translations";
import {
  anonymousReviewerName,
  displayReviewerName,
  MAX_REVIEW_NAME_LENGTH,
  prepareReview,
} from "@/lib/reviewInput";

const review = (name: string, id = 1) => ({
  id,
  name,
  country: "Kenya",
  message: "Very helpful",
  rating: 5,
  approved: true,
  created_at: "2026-01-01T00:00:00Z",
});

/** Mocks the reviews API (never the real database) and records what the form posts. */
async function mockReviews(page: Page, listed: ReturnType<typeof review>[] = []) {
  const posted: Record<string, unknown>[] = [];
  await page.route(/\/api\/reviews/, async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      posted.push(body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(review(String(body.name ?? ""), 99)),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(listed) });
  });
  return posted;
}

async function fillAndSubmit(page: Page, fields: { name?: string; country?: string; message?: string }) {
  if (fields.name !== undefined) await page.locator("#review-name").fill(fields.name);
  if (fields.country !== undefined) await page.locator("#review-country").fill(fields.country);
  if (fields.message !== undefined) await page.locator("#review-message").fill(fields.message);
  await page.getByRole("button", { name: /Submit feedback|Отправить отзыв/i }).click();
}

test.describe("Review form: the name is an optional nickname", () => {
  test("labels, placeholder and the personal-data hint (English)", async ({ page }) => {
    await mockReviews(page);
    await page.goto("/reviews");

    await expect(page.getByLabel("Name or nickname (optional)")).toBeVisible();
    await expect(page.locator("#review-name")).toHaveAttribute("placeholder", "e.g. Alex");
    await expect(page.locator("#review-name")).not.toHaveAttribute("required", /.*/);
    await expect(
      page.getByText("Please do not include your surname, phone number or other personal details."),
    ).toBeVisible();
  });

  test("labels, placeholder and the personal-data hint (Russian)", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("hn-language", "ru"));
    await mockReviews(page);
    await page.goto("/reviews");

    await expect(page.getByLabel("Имя или псевдоним (необязательно)")).toBeVisible();
    await expect(page.locator("#review-name")).toHaveAttribute("placeholder", "Например: Паша / Alex");
    await expect(
      page.getByText("Не указывайте фамилию, телефон или другие личные данные."),
    ).toBeVisible();
  });

  test("an empty name is accepted and sent with the UI language", async ({ page }) => {
    const posted = await mockReviews(page);
    await page.goto("/reviews");

    await fillAndSubmit(page, { country: "Kenya", message: "Very helpful" });

    await expect(page.locator("p[role='status']")).toBeVisible();
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ name: "", language: "en", country: "Kenya", message: "Very helpful" });
  });

  test("a nickname is accepted", async ({ page }) => {
    const posted = await mockReviews(page);
    await page.goto("/reviews");

    await fillAndSubmit(page, { name: "  Alex  ", country: "Kenya", message: "Very helpful" });

    await expect(page.locator("p[role='status']")).toBeVisible();
    expect(posted[0]).toMatchObject({ name: "Alex" });
  });

  test("country and message are still required, the name is not", async ({ page }) => {
    const posted = await mockReviews(page);
    await page.goto("/reviews");

    await fillAndSubmit(page, { name: "Alex", country: "", message: "" });
    await expect(page.getByText("Please enter your country and message.")).toBeVisible();
    expect(posted).toHaveLength(0);
  });

  test("a review without a name is listed as Anonymous (English) / Аноним (Russian)", async ({ page }) => {
    await mockReviews(page, [review("", 1), review("   ", 2), review("Alex", 3)]);
    await page.goto("/reviews");

    const cards = page.locator("article");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Anonymous");
    await expect(cards.nth(1)).toContainText("Anonymous");
    await expect(cards.nth(2)).toContainText("Alex");
    await expect(cards.nth(2)).not.toContainText("Anonymous");

    await page.addInitScript(() => localStorage.setItem("hn-language", "ru"));
    await page.reload();
    await expect(page.locator("article").nth(0)).toContainText("Аноним");
  });
});

test.describe("Review input (unit)", () => {
  test("an empty or blank name becomes the Anonymous word of the submitter's language", () => {
    for (const name of [undefined, "", "   "]) {
      const ru = prepareReview({ name, country: "Kenya", message: "ok", rating: 5, language: "ru" });
      expect(ru.ok && ru.row.name).toBe("Аноним");
      const en = prepareReview({ name, country: "Kenya", message: "ok", rating: 5, language: "en" });
      expect(en.ok && en.row.name).toBe("Anonymous");
      const unknown = prepareReview({ name, country: "Kenya", message: "ok", rating: 5 });
      expect(unknown.ok && unknown.row.name).toBe("Anonymous");
    }
    expect(anonymousReviewerName("xx")).toBe("Anonymous");
    for (const code of ["en", "ru", "es", "fr", "de", "zh", "ar"] as const) {
      expect(anonymousReviewerName(code)).toBe(translations[code].reviewAnonymous);
      expect(translations[code].reviewAnonymous.length).toBeGreaterThan(0);
    }
  });

  test("a stored value is never empty, so the NOT NULL column and the insert policy are satisfied", () => {
    const result = prepareReview({ name: " ", country: "Kenya", message: "ok", rating: 4, language: "de" });
    expect(result.ok && result.row.name.trim().length).toBeGreaterThan(0);
  });

  test("a nickname is kept, trimmed and limited in length", () => {
    const nick = prepareReview({ name: "  Alex  ", country: "Kenya", message: "ok", rating: 5 });
    expect(nick.ok && nick.row.name).toBe("Alex");

    const long = prepareReview({ name: "x".repeat(200), country: "Kenya", message: "ok", rating: 5 });
    expect(long.ok && long.row.name).toHaveLength(MAX_REVIEW_NAME_LENGTH);
  });

  test("country, message and rating are validated; new reviews are unapproved", () => {
    expect(prepareReview({ country: "", message: "ok", rating: 5 }).ok).toBe(false);
    expect(prepareReview({ country: "Kenya", message: "  ", rating: 5 }).ok).toBe(false);
    expect(prepareReview({ country: "Kenya", message: "ok", rating: 0 }).ok).toBe(false);
    expect(prepareReview({ country: "Kenya", message: "ok", rating: 6 }).ok).toBe(false);
    expect(prepareReview({ country: "Kenya", message: "ok", rating: Number.NaN }).ok).toBe(false);

    const ok = prepareReview({ country: "Kenya", message: "ok", rating: 4.6 });
    expect(ok.ok && ok.row).toMatchObject({ rating: 5, approved: false });
  });

  test("displayReviewerName falls back for empty names, also for old rows", () => {
    expect(displayReviewerName("", "Anonymous")).toBe("Anonymous");
    expect(displayReviewerName("  ", "Аноним")).toBe("Аноним");
    expect(displayReviewerName(null, "Anonymous")).toBe("Anonymous");
    expect(displayReviewerName("Alex", "Anonymous")).toBe("Alex");
  });
});
