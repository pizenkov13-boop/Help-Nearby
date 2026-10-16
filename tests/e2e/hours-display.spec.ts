import { test, expect } from "@playwright/test";
import {
  formatWeeklyHours,
  getHoursDisplay,
  getOrganizationOpenStatus,
} from "@/lib/orgUtils";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

// Like the Croix-Rouge française entries: verified, no hours, no phone, no e-mail.
const moulins: Organization = {
  ...base,
  id: "7002",
  slug: "crf-unite-locale-de-moulins",
  name: "Croix-Rouge française – Unité locale de Moulins",
  country: "France",
  city: "Moulins",
  phone: "",
  email: "",
  website: "https://www.croix-rouge.fr/annuaire/moulins",
  hours: {},
  hoursRaw: "",
  verified: true,
};

test.describe("Opening hours rules (unit)", () => {
  test("no hours at all: nothing to list, status unknown", () => {
    expect(getHoursDisplay(moulins)).toEqual({ kind: "unknown" });
    expect(getOrganizationOpenStatus(moulins)).toBe("unknown");
    expect(formatWeeklyHours({})).toEqual([]);
  });

  test("Closed appears only for a day that is explicitly null; absent days are not listed", () => {
    const hours = {
      monday: { open: "09:00", close: "17:00" },
      tuesday: null,
    };
    expect(formatWeeklyHours(hours)).toEqual([
      "Monday: 9:00 AM – 5:00 PM",
      "Tuesday: Closed",
    ]);
    expect(getHoursDisplay({ ...moulins, hours })).toEqual({
      kind: "listed",
      lines: ["Monday: 9:00 AM – 5:00 PM", "Tuesday: Closed"],
    });
  });

  test("raw text hours are shown only when they can be parsed (24/7)", () => {
    expect(getHoursDisplay({ ...moulins, hoursRaw: "24/7" })).toEqual({
      kind: "listed",
      lines: ["24/7"],
    });
    expect(getHoursDisplay({ ...moulins, hoursRaw: "ask at the desk" })).toEqual({
      kind: "unknown",
    });
  });

  test("a day missing from structured hours is unknown, never closed", () => {
    const org: Organization = { ...moulins, hours: { monday: { open: "09:00", close: "17:00" } } };
    const wednesday = new Date("2026-10-14T12:00:00");
    expect(getOrganizationOpenStatus(org, wednesday)).toBe("unknown");
  });
});

test.describe("Organization page without hours", () => {
  test("a Croix-Rouge-style entry shows no Closed, the not-listed line and a website link; empty rows are absent", async ({
    page,
  }) => {
    // /org/e2e-croix-rouge-moulins is a fixture served only when the test web server enables it.
    const response = await page.goto("/org/e2e-croix-rouge-moulins");
    test.skip(
      response?.status() === 404,
      "fixture organization is only available on the Playwright web server",
    );

    const section = page.locator("section").filter({ hasText: /Contact/i }).first();
    await expect(section).toBeVisible();

    await expect(section.getByTestId("org-hours")).toContainText(
      "Opening hours not listed. Check the source website or call before you go.",
    );
    // No "Closed", "Open now" or per-day schedule anywhere on the page.
    const main = page.locator("main");
    await expect(main).not.toContainText("Closed");
    await expect(main).not.toContainText("Open now");
    for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
      await expect(main).not.toContainText(day);
    }

    // The organization's website is linked (new tab, noopener).
    const site = section.locator('a[href="https://www.croix-rouge.fr/annuaire/moulins"]');
    await expect(site).toBeVisible();
    await expect(site).toHaveAttribute("target", "_blank");
    await expect(site).toHaveAttribute("rel", /noopener/);

    // Empty phone and e-mail: no rows, no icons, no tel:/mailto: links, no Call Now button.
    await expect(main.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(main.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(section.locator(".lucide-phone")).toHaveCount(0);
    await expect(section.locator(".lucide-mail")).toHaveCount(0);
    await expect(main.getByRole("link", { name: /Call Now/i })).toHaveCount(0);

    // The rows that do have values are still there.
    await expect(section).toContainText("12 Rue de la Paix");
  });
});
