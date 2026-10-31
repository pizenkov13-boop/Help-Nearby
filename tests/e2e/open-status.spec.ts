import { test, expect } from "./fixtures";
import { filterEmergency247Organizations } from "@/lib/emergency";
import { getOrganizationOpenStatus } from "@/lib/orgUtils";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS, preferFullMode } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const noHours: Organization = {
  ...base,
  id: "crf-test",
  slug: "crf-test-delegation",
  name: "CRF Test Delegation",
  description: "Aide alimentaire.",
  hours: {},
  hoursRaw: "",
  verified: true,
};

const always: Organization = {
  ...base,
  id: "hours-247",
  slug: "e2e-247-clinic",
  name: "E2E 24/7 Clinic",
  description: "Always open",
  hours: {},
  hoursRaw: "24/7",
  verified: true,
};

test.describe("Unknown opening hours (unit)", () => {
  test("missing hours have unknown status, 24/7 is open", () => {
    expect(getOrganizationOpenStatus(noHours)).toBe("unknown");
    expect(getOrganizationOpenStatus({ ...noHours, hoursRaw: "see website" })).toBe(
      "unknown",
    );
    expect(getOrganizationOpenStatus(always)).toBe("open");
  });

  test("emergency list excludes missing hours and includes explicit 24/7", () => {
    const result = filterEmergency247Organizations([
      noHours,
      { ...noHours, id: "x", name: "Emergency Room Food Pantry", description: "urgent care" },
      always,
    ]);
    expect(result.map((o) => o.id)).toEqual(["hours-247"]);
  });
});

test.describe("Open now badge on /recent", () => {
  test("shows the badge only for organizations with known hours", async ({ page }) => {
    await preferFullMode(page);
    await page.route(/\/api\/organizations\/recent/, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          organizations: [noHours, always],
          hasMore: false,
          error: false,
        }),
      }),
    );
    await page.goto("/recent");

    // Retry the click until hydration has attached the handler.
    await expect(async () => {
      await page.getByRole("button", { name: "Food", exact: true }).click();
      await expect(page.getByTestId("recent-list").locator("article")).toHaveCount(2, {
        timeout: 2_000,
      });
    }).toPass();

    const cards = page.getByTestId("recent-list").locator("article");
    await expect(cards.filter({ hasText: "E2E 24/7 Clinic" }).getByText("Open now")).toBeVisible();

    const unknown = cards.filter({ hasText: "CRF Test Delegation" });
    await expect(unknown).toHaveCount(1);
    await expect(unknown.getByText(/Open now|Closed/)).toHaveCount(0);
  });
});
