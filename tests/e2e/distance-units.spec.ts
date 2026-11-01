import { test, expect } from "./fixtures";
import {
  formatDistance,
  parseDistanceMiles,
  unitForCountry,
  unitForLocales,
} from "@/lib/distanceUnits";
import { formatSearchNearestOrgs, formatSearchRadiusWithin } from "@/lib/i18n/translations";
import { grantNycLocation, mockNearbyApi, preferFullMode } from "./helpers";

test.describe("Distance units (unit)", () => {
  test("miles for the US, UK, Liberia and Myanmar, kilometres everywhere else", () => {
    for (const code of ["US", "GB", "LR", "MM", "us"]) expect(unitForCountry(null, code)).toBe("mi");
    for (const code of ["FR", "DE", "RU", "CN", "SA", "CA"]) expect(unitForCountry(null, code)).toBe("km");
    expect(unitForCountry("United Kingdom")).toBe("mi");
    expect(unitForCountry("Burma")).toBe("mi");
    expect(unitForCountry("Germany")).toBe("km");
    expect(unitForLocales(["en-GB", "en"])).toBe("mi");
    expect(unitForLocales(["ru-RU"])).toBe("km");
    expect(unitForLocales(["en"])).toBeNull();
  });

  test("distances are converted and labelled in the visitor's language", () => {
    expect(parseDistanceMiles("0.5 mi")).toBeCloseTo(0.5);
    expect(parseDistanceMiles("264 ft")).toBeCloseTo(0.05);
    expect(parseDistanceMiles("far")).toBeNull();
    expect(formatDistance("1.0 mi", "km", "en")).toBe("1.6 km");
    expect(formatDistance("1.0 mi", "km", "ru")).toBe("1.6 км");
    expect(formatDistance("1.0 mi", "mi", "en")).toBe("1.0 mi");
    expect(formatDistance("100 ft", "km", "en")).toBe("30 m");
    expect(formatDistance("100 ft", "mi", "en")).toBe("100 ft");
  });

  test("the search-radius label takes the same unit in every language", () => {
    const miles = { value: 3.1, label: "mi" };
    expect(formatSearchRadiusWithin("en", 5, miles)).toBe("Showing results within 3.1 mi");
    expect(formatSearchNearestOrgs("en", 5.3, { value: 3.3, label: "mi" })).toBe("Nearest organizations (3.3 mi away)");
    expect(formatSearchRadiusWithin("ru", 5, { value: 3.1, label: "миль" })).toContain("3.1 миль");
    expect(formatSearchRadiusWithin("zh", 5, { value: 3.1, label: "英里" })).toContain("3.1 英里");
    expect(formatSearchRadiusWithin("en", 5)).toBe("Showing results within 5 km");
  });
});

test.describe("Distance units (browser)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  async function openAndRead(page: import("@playwright/test").Page) {
    await grantNycLocation(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Find Help Near Me|Найти помощь|Hilfe in meiner/i }).first().click();
    const distance = page.getByTestId("org-distance").first();
    await expect(distance).toBeVisible({ timeout: 30_000 });
    const label = page.locator(".map-panel p", { hasText: /\d(\.\d)? (km|mi|км|миль)/ }).first();
    return { card: (await distance.textContent())!, label: (await label.textContent())! };
  }

  test("searching in the US shows miles on the card and above the list", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    const { card, label } = await openAndRead(page);
    expect(card).toMatch(/mi$/);
    expect(label).toMatch(/mi\b/);
  });

  test("searching in Germany shows kilometres on the card and above the list", async ({ page }) => {
    await preferFullMode(page);
    await mockNearbyApi(page);
    await page.route(/\/api\/geocode\/reverse/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ country: "Germany", countryCode: "DE" }),
      }),
    );
    const { card, label } = await openAndRead(page);
    expect(card).toMatch(/km$|m$/);
    expect(card).not.toMatch(/mi$/);
    expect(label).toMatch(/km\b/);
  });
});
