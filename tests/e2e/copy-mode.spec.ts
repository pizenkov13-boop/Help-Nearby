import { test, expect } from "./fixtures";

/**
 * Copy mode: a site deployed from the template, built with NEXT_PUBLIC_SITE_URL on another domain.
 * Run with `npm run test:e2e:copy` (own build, own config). Skipped in the normal run.
 */
test.skip(process.env.E2E_COPY_MODE !== "1", "needs a copy-mode build (npm run test:e2e:copy)");

const COPY_ORIGIN = "https://copy.example.org";

test.describe("copy mode", () => {
  test("footer has no main-site branding and carries the Powered by HelpNearby credit", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const text = await footer.innerText();
    expect(text).not.toMatch(/help\.nearby1/i);
    expect(text).not.toMatch(/kindness/i);
    expect(text).not.toMatch(/sustainable development goals/i);
    expect(text).not.toMatch(/hello@help-nearby\.org/i);

    const hrefs = await footer.locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
    expect(hrefs.join(" ")).not.toMatch(/instagram\.com\/help\.nearby1|kindness|sdgs\.un\.org|hello@help-nearby\.org/i);
    expect(await footer.locator("img[src*='sdg']").count()).toBe(0);

    const credit = footer.getByTestId("footer-powered-by");
    await expect(credit).toContainText("Powered by");
    await expect(credit.getByRole("link", { name: "HelpNearby" })).toHaveAttribute(
      "href",
      "https://www.help-nearby.org/",
    );
  });

  test("submit and reviews are not available", async ({ request }) => {
    expect((await request.get("/submit")).status()).toBe(404);
    expect((await request.get("/reviews")).status()).toBe(404);
    expect((await request.post("/api/submit", { data: {} })).status()).toBe(404);
  });

  test("privacy page opens and does not name the main site's operator", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);

    const main = page.locator("main");
    await expect(main).toContainText(/location/i);
    const text = await main.innerText();
    expect(text).not.toMatch(/help-nearby\.org|hello@|izenkin|pavel|kindness/i);
    expect(await main.locator("a[href*='help-nearby.org']").count()).toBe(0);
  });

  test("sitemap and robots point only at the copy's own address", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc.startsWith(`${COPY_ORIGIN}/`), `${loc} is not on the copy`).toBe(true);
    }
    expect(locs).toContain(`${COPY_ORIGIN}/privacy`);
    for (const closed of ["/submit", "/reviews", "/recent", "/why-it-matters"]) {
      expect(locs).not.toContain(`${COPY_ORIGIN}${closed}`);
    }

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain(`Sitemap: ${COPY_ORIGIN}/sitemap.xml`);
    expect(robots).not.toContain("help-nearby.org");
  });
});
