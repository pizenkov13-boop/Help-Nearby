import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { grantNycLocation, MOCK_NEARBY_ORGS, mockNearbyApi, orgCards, preferFullMode } from "./helpers";

/**
 * Phone scenarios for the location request, shared by the Pixel (chromium) and iPhone (webkit) specs.
 * The browser's answer is stubbed where the engines would differ (denied, never answers, in-app browser).
 */

const NICE = { name: "Nice, France", lat: 43.7102, lng: 7.262, country: "France", countryCode: "FR" };

/** One organization in Nice, so a typed-city search has something to show. */
async function mockNiceOrganization(page: Page) {
  const nice = { ...MOCK_NEARBY_ORGS[0], id: "nice-1", slug: "nice-1", name: "Croix-Rouge Nice", city: "Nice", country: "France", lat: 43.712, lng: 7.265 };
  for (const pattern of [/\/api\/nearby/, /\/api\/organizations/]) {
    await page.route(pattern, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([nice]) }));
  }
}

type Stub = "denied" | "unavailable" | "hang";

async function stubGeolocation(page: Page, stub: Stub, userAgent?: string) {
  await page.addInitScript(
    ({ mode, ua }) => {
      const w = window as unknown as { __geoCalls: number };
      w.__geoCalls = 0;
      const fake = {
        getCurrentPosition(_ok: unknown, fail?: (e: unknown) => void) {
          w.__geoCalls += 1;
          if (mode === "hang" || !fail) return; // the prompt is never answered
          const code = mode === "denied" ? 1 : 2;
          setTimeout(() => fail({ code, message: mode, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }), 50);
        },
        watchPosition: () => 0,
        clearWatch: () => {},
      };
      Object.defineProperty(navigator, "geolocation", { value: fake, configurable: true });
      if (ua) Object.defineProperty(navigator, "userAgent", { value: ua, configurable: true });
    },
    { mode: stub, ua: userAgent ?? null },
  );
}

async function setup(page: Page) {
  await preferFullMode(page);
  await mockNearbyApi(page);
  await page.route(/\/api\/geocode(?!\/reverse)/, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [NICE] }) }),
  );
}

async function shot(page: Page, name: string, label: string) {
  const dir = process.env.GEO_SHOTS;
  if (!dir) return;
  // The results panel is below the hero: capture it when it is open, the page otherwise.
  const panel = page.locator(".map-panel");
  if (await panel.count()) await panel.first().screenshot({ path: `${dir}/${label}-${name}.png` });
  else await page.screenshot({ path: `${dir}/${label}-${name}.png` });
}

const findButton = (page: Page) => page.getByRole("button", { name: /Find Help Near Me|Locating/i });

export function registerGeolocationScenarios(label: string) {
  test.describe(`Phone location request (${label})`, () => {
    test("the find-help button is on screen and not covered by the header", async ({ page, request }) => {
      await setup(page);
      await page.goto("/");
      const button = findButton(page);
      await expect(button).toBeVisible();
      await expect(button).toBeInViewport();
      const covered = await button.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(top === el || el.contains(top));
      });
      expect(covered).toBe(false);
      await shot(page, "home", label);

      // The site allows location for itself only.
      const response = await request.get("/");
      expect(response.headers()["permissions-policy"]).toBe("geolocation=(self)");
    });

    test("allowed: one tap shows results near the position", async ({ page }) => {
      await setup(page);
      await grantNycLocation(page);
      await page.goto("/");
      await findButton(page).tap();
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 30_000 });
      await expect(orgCards(page).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId("place-label")).toBeVisible();
      await shot(page, "allowed", label);
    });

    test("denied: a clear message, the city field, and a city search that needs no location", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "denied");
      await page.goto("/");
      await findButton(page).tap();

      await expect(page.getByTestId("location-needed")).toContainText("Location access is blocked", { timeout: 10_000 });
      await expect(page.getByTestId("location-needed")).toContainText("type a city below");
      // No place yet: no list, no counter and no endless loading skeleton under the message.
      await expect(page.getByText(/organizations found/)).toHaveCount(0);
      await shot(page, "denied", label);

      await mockNiceOrganization(page);
      await page.locator("#org-search").fill("Nice, France");
      await page.locator("#org-search").press("Enter");
      await expect(page.getByTestId("place-label")).toHaveText("Results near: Nice, France", { timeout: 20_000 });
      await expect(orgCards(page).first()).toBeVisible({ timeout: 20_000 });
      await shot(page, "denied-city", label);
    });

    test("no position available: asks for a city", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "unavailable");
      await page.goto("/");
      await findButton(page).tap();
      await expect(page.getByTestId("location-needed")).toContainText("Couldn't determine your location", { timeout: 10_000 });
      await expect(page.locator("#org-search")).toBeVisible();
    });

    test("the prompt never answers: the panel and the city field are there at once, then a message", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "hang");
      await page.goto("/");
      await findButton(page).tap();

      // Immediately: waiting message and a usable city field (not a button stuck on "Locating...").
      await expect(page.locator("#org-search")).toBeVisible({ timeout: 5_000 });
      await expect(page.getByTestId("location-needed")).toContainText("Waiting for your permission");
      await shot(page, "hang-waiting", label);

      // The city search works while the request is still pending.
      await mockNiceOrganization(page);
      await page.locator("#org-search").fill("Nice, France");
      await page.locator("#org-search").press("Enter");
      await expect(page.getByTestId("place-label")).toHaveText("Results near: Nice, France", { timeout: 20_000 });
      await expect(orgCards(page).first()).toBeVisible({ timeout: 20_000 });
    });

    test("the prompt never answers and no city is typed: after 12 s the message says what to do", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "hang");
      await page.goto("/");
      await findButton(page).tap();
      await expect(page.getByTestId("location-needed")).toContainText("got no answer", { timeout: 20_000 });
      await expect(page.getByTestId("location-needed")).toContainText("regular browser");
      // The button is usable again.
      await expect(page.getByRole("button", { name: /Find Help Near Me/i })).toBeEnabled();
      await shot(page, "hang-message", label);
    });

    test("in an Instagram/Telegram-style embedded browser: open it in the regular browser or type a city", async ({ page }) => {
      await setup(page);
      await stubGeolocation(
        page,
        "denied",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0",
      );
      await page.goto("/");
      await findButton(page).tap();
      await expect(page.getByTestId("location-needed")).toContainText("in-app browser doesn't share your location", { timeout: 10_000 });
      await expect(page.getByTestId("location-needed")).toContainText("regular browser");
      await expect(page.locator("#org-search")).toBeVisible();
      await shot(page, "in-app", label);
    });

    test("Lite mode still asks, and only after the tap", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "denied");
      await page.addInitScript(() => localStorage.setItem("help-nearby-view-mode", "lite"));
      await page.goto("/");
      await page.waitForTimeout(1_500);
      // Nothing asks for the location while the page just sits there.
      expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);

      await findButton(page).tap();
      await expect(page.getByTestId("location-needed")).toBeVisible({ timeout: 10_000 });
      expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(1);
      await expect(page.locator(".leaflet-container")).toHaveCount(0);
    });

    test("Use my location after a refusal asks again", async ({ page }) => {
      await setup(page);
      await stubGeolocation(page, "denied");
      await page.goto("/");
      await findButton(page).tap();
      await expect(page.getByTestId("location-needed")).toContainText("blocked", { timeout: 10_000 });
      await page.getByTestId("location-needed").getByRole("button", { name: "Use my location" }).tap();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(2);
    });
  });
}
