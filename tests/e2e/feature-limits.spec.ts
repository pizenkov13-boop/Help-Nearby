import { test, expect } from "./fixtures";

/**
 * FORMS_DISABLED_COUNTRIES and CHAT_ENABLED. The fictitious code XX stands in for a real one (ZZ is used by the BLOCKED_COUNTRIES tests).
 * - Normal run (neither variable set): everything works, whatever the header says.
 * - `npm run test:e2e:region` (own server with FORMS_DISABLED_COUNTRIES=XX and CHAT_ENABLED=false).
 * - Copy mode ignores FORMS_DISABLED_COUNTRIES: see copy-mode.spec.ts.
 */
const LIMITED_RUN = process.env.E2E_REGION_BLOCK === "1";

const asZz = { "x-vercel-ip-country": "XX" };
const asYy = { "x-vercel-ip-country": "YY" };
const review = { name: "", country: "Anywhere", message: "A test message", rating: 5 };

test.describe("without FORMS_DISABLED_COUNTRIES and CHAT_ENABLED", () => {
  test.skip(LIMITED_RUN, "the variables are set in this run");

  test("the features endpoint reports everything on, whatever the header says", async ({ request }) => {
    const response = await request.get("/api/features", { headers: asZz });
    expect(response.status()).toBe(200);
    // The answer depends on the request: no shared cache may keep it.
    expect(response.headers()["cache-control"] ?? "").not.toMatch(/public|s-maxage/);
    expect(await response.json()).toEqual({ chat: true, forms: true });
  });

  test("the forms are shown and the APIs do not answer 403", async ({ page, request }) => {
    await page.setExtraHTTPHeaders(asZz);
    await page.goto("/reviews");
    await expect(page.getByLabel("Name or nickname (optional)")).toBeVisible();
    await expect(page.getByTestId("forms-unavailable")).toHaveCount(0);

    await page.goto("/submit");
    await expect(page.getByRole("button", { name: /Submit Organization/i })).toBeVisible();

    expect((await request.post("/api/reviews", { headers: asZz, data: review })).status()).not.toBe(403);
    expect((await request.post("/api/submit", { headers: asZz, data: {} })).status()).not.toBe(403);
  });

  test("the chat widget is on and its API is not hidden", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "AI Assistant" })).toBeVisible();
    expect((await request.post("/api/chat", { data: {} })).status()).not.toBe(404);
  });
});

test.describe("with FORMS_DISABLED_COUNTRIES=XX and CHAT_ENABLED=false", () => {
  test.skip(!LIMITED_RUN, "needs the region server (npm run test:e2e:region)");

  test("the features endpoint is per request and reveals only booleans", async ({ request }) => {
    const blocked = await request.get("/api/features", { headers: asZz });
    expect(await blocked.json()).toEqual({ chat: false, forms: false });
    const other = await request.get("/api/features", { headers: asYy });
    expect(await other.json()).toEqual({ chat: false, forms: true });
    const none = await request.get("/api/features");
    expect(await none.json()).toEqual({ chat: false, forms: true });
  });

  test("review form: hidden for XX, replaced by one neutral line; reading reviews still works", async ({ page }) => {
    await page.setExtraHTTPHeaders(asZz);
    await page.goto("/reviews");
    await expect(page.getByTestId("forms-unavailable")).toHaveText(
      "Submitting forms is temporarily unavailable in your region",
    );
    await expect(page.getByLabel("Name or nickname (optional)")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Submit feedback/i })).toHaveCount(0);
    // Reading is not affected: the page itself is served.
    await expect(page.getByRole("heading", { name: /Reviews/i })).toBeVisible();
  });

  test("organization form: hidden for XX, replaced by one neutral line", async ({ page }) => {
    await page.setExtraHTTPHeaders(asZz);
    await page.goto("/submit");
    await expect(page.getByTestId("forms-unavailable")).toHaveText(
      "Submitting forms is temporarily unavailable in your region",
    );
    await expect(page.getByLabel(/^Name/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Submit Organization/i })).toHaveCount(0);
  });

  test("another country sees both forms", async ({ page }) => {
    await page.setExtraHTTPHeaders(asYy);
    await page.goto("/reviews");
    await expect(page.getByLabel("Name or nickname (optional)")).toBeVisible();
    await expect(page.getByTestId("forms-unavailable")).toHaveCount(0);
    await page.goto("/submit");
    await expect(page.getByRole("button", { name: /Submit Organization/i })).toBeVisible();
    await expect(page.getByTestId("forms-unavailable")).toHaveCount(0);
  });

  test("POST /api/reviews answers 403 for XX only; reading reviews still works", async ({ request }) => {
    expect((await request.post("/api/reviews", { headers: asZz, data: review })).status()).toBe(403);
    expect((await request.post("/api/reviews", { headers: asYy, data: review })).status()).not.toBe(403);
    expect((await request.post("/api/reviews", { data: review })).status()).not.toBe(403);
    expect((await request.get("/api/reviews", { headers: asZz })).status()).not.toBe(403);
  });

  test("POST /api/submit answers 403 for XX only", async ({ request }) => {
    const organization = { name: "Test organization", category: "food", country: "Anywhere", city: "Anywhere", address: "1 Test Street" };
    expect((await request.post("/api/submit", { headers: asZz, data: organization })).status()).toBe(403);
    expect((await request.post("/api/submit", { headers: asYy, data: organization })).status()).not.toBe(403);
    expect((await request.post("/api/submit", { data: organization })).status()).not.toBe(403);
  });

  test("CHAT_ENABLED=false hides the widget and the API answers 404", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "AI Assistant" })).toHaveCount(0);
    expect((await request.post("/api/chat", { data: { messages: [{ role: "user", content: "hi" }] } })).status()).toBe(404);
  });
});
