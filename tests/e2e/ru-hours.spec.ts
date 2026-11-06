import { test, expect } from "@playwright/test";
import { evaluateRussianSchedule, parseRussianSchedule } from "@/lib/openingHours";
import { getHoursDisplay, getOrganizationOpenStatus, isOrganizationOpen } from "@/lib/orgUtils";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

// Local-time dates, 12 Oct 2026 is a Monday.
const at = (day: number, time: string) => new Date(`2026-10-${day}T${time}:00`);
const MON = 12;
const TUE = 13;
const FRI = 16;
const SAT = 17;
const SUN = 18;

const catalog = (hoursRaw: string): Organization => ({
  ...base,
  id: "9001",
  slug: "catalog-entry-test",
  country: "Testland",
  hours: {},
  hoursRaw,
  verified: true,
});

const status = (text: string, date: Date) => evaluateRussianSchedule(parseRussianSchedule(text)!, date);

// The fully understood forms found in the catalog (17 records, 15 distinct strings).
const FULL = [
  "Пн–Чт 19:00–20:00",
  "Пн–Пт 20:30–21:00",
  "Пн–Пт 21:30–22:15",
  "Пн–Пт 19:00–19:30",
  "Пн–Пт 22:00–22:30",
  "Пн–Пт 23:00–23:30",
  "Пн,Ср,Чт,Пт 14:00–15:00",
  "Вс 9:30–11:00",
  "Вс 18:30–19:00",
  "Пн–Вс 20:00–20:30",
  "Сб 12:00–14:00",
  "Пн–Пт 9:30–12:00",
  "Пн–Пт 10:00–18:00",
  "Ежедневно 13:00–21:00",
  "Пн–Пт 9:00–16:40",
];

// Partial or not understood: must stay raw text and unknown.
const NOT_FULL = [
  "Соцработники: Пн,Ср,Пт 10:00–17:00; Вт только женщины 11:30–13:30. Одежда: Пн,Ср,Пт,Сб,Вс 10:00–12:00. Душ: Пн,Ср,Пт,Сб,Вс 10:30–17:30",
  "Соцработники: Пн,Вт,Ср,Пт 10:00–17:00 (перерыв 14:00–15:00). Юристы: Ср,Пт 10:00–17:00",
  "Ежедневно 20:00–08:00, круглый год",
  "15.10–15.04, ежедневно 20:00–08:00",
  "Пн–Пт 10:00–17:00 (приём до 14:30)",
  "Пн,Вт,Ср,Пт 12:00–14:00; Чт только женщины",
  "Чт 16:00 обед; Вс 9:30 завтрак",
  "Вс 12:00",
  "Вс 15:00",
  "Пн–Вс 14:00",
  "Сб 12:15",
  "Вт 17:00",
  "Вт–Сб (зима 15:00–22:00, лето 10:00–17:00)",
  "Сезонный обогрев",
  "20:00–08:00",
  "Сезонно при −15 °C, 20:00–08:00",
  "ask at the desk",
  "24/7",
];

test.describe("Russian weekday schedules (unit)", () => {
  test("all 15 fully understood forms parse", () => {
    for (const text of FULL) expect(parseRussianSchedule(text), text).not.toBeNull();
  });

  test("partial and not understood strings do not parse (including a bare time range without days)", () => {
    for (const text of NOT_FULL) expect(parseRussianSchedule(text), text).toBeNull();
  });

  test("days: ranges, lists, everyday and a range wrapping the week", () => {
    expect(parseRussianSchedule("Пн–Чт 19:00–20:00")![0]!.days).toEqual([1, 2, 3, 4]);
    expect(parseRussianSchedule("Пн,Ср,Чт,Пт 14:00–15:00")![0]!.days).toEqual([1, 3, 4, 5]);
    expect(parseRussianSchedule("Вс 9:30–11:00")![0]!.days).toEqual([0]);
    expect(parseRussianSchedule("Ежедневно 13:00–21:00")![0]!.days).toHaveLength(7);
    expect(parseRussianSchedule("Сб–Пн 10:00–12:00")![0]!.days).toEqual([6, 0, 1]);
    expect(parseRussianSchedule("пн-пт 10:00-12:00")).not.toBeNull(); // hyphen, lower case
  });

  test("several segments, invalid times and an empty window are rejected", () => {
    expect(parseRussianSchedule("Пн 10:00–12:00; Сб 12:00–14:00")).toHaveLength(2);
    expect(parseRussianSchedule("Пн 25:00–26:00")).toBeNull();
    expect(parseRussianSchedule("Пн 10:61–12:00")).toBeNull();
    expect(parseRussianSchedule("Пн 10:00–10:00")).toBeNull();
    expect(parseRussianSchedule("Пн 10:00–12:00; продукты")).toBeNull();
  });

  test("inside the window: open; outside: unknown, never closed", () => {
    const text = "Пн–Чт 19:00–20:00";
    expect(status(text, at(MON, "19:00"))).toBe("open");
    expect(status(text, at(MON, "19:59"))).toBe("open");
    expect(status(text, at(MON, "20:00"))).toBe("unknown");
    expect(status(text, at(MON, "12:00"))).toBe("unknown");
    expect(status(text, at(FRI, "19:30"))).toBe("unknown"); // Friday is not listed
    expect(status(text, at(SUN, "19:30"))).toBe("unknown");
  });

  test("a window that crosses midnight: 23:30 and 07:30", () => {
    const weekdays = "Пн–Пт 20:00–08:00";
    expect(status(weekdays, at(MON, "23:30"))).toBe("open"); // evening of a listed day
    expect(status(weekdays, at(TUE, "07:30"))).toBe("open"); // morning after Monday's window
    expect(status(weekdays, at(TUE, "08:00"))).toBe("unknown"); // the window has ended
    expect(status(weekdays, at(TUE, "12:00"))).toBe("unknown");
    expect(status(weekdays, at(FRI, "23:30"))).toBe("open");
    expect(status(weekdays, at(SAT, "07:30"))).toBe("open"); // Friday's window runs into Saturday
    expect(status(weekdays, at(SAT, "23:30"))).toBe("unknown"); // Saturday is not listed
    expect(status(weekdays, at(MON, "07:30"))).toBe("unknown"); // Sunday is not listed

    const daily = "Ежедневно 20:00–08:00";
    expect(status(daily, at(SUN, "23:30"))).toBe("open");
    expect(status(daily, at(MON, "07:30"))).toBe("open");
    expect(status(daily, at(MON, "12:00"))).toBe("unknown");
  });
});

test.describe("Russian schedules in the app", () => {
  test("status is open inside the window and unknown outside; Closed is never produced", () => {
    const org = catalog("Пн–Пт 19:00–19:30");
    expect(getOrganizationOpenStatus(org, at(MON, "19:10"))).toBe("open");
    expect(getOrganizationOpenStatus(org, at(MON, "12:00"))).toBe("unknown");
    expect(getOrganizationOpenStatus(org, at(SUN, "19:10"))).toBe("unknown");
  });

  test("the Open now filter never hides them", () => {
    const org = catalog("Пн–Пт 19:00–19:30");
    expect(isOrganizationOpen(org, at(MON, "19:10"))).toBe(true);
    expect(isOrganizationOpen(org, at(MON, "12:00"))).toBe(true);
    expect(isOrganizationOpen(org, at(SUN, "03:00"))).toBe(true);
  });

  test("the schedule text is shown as written, inside and outside the window", () => {
    const org = catalog("Пн–Пт 19:00–19:30");
    expect(getHoursDisplay(org)).toEqual({ kind: "listed", lines: ["Пн–Пт 19:00–19:30"] });
  });

  test("partial and not understood strings stay raw text with unknown status", () => {
    for (const text of NOT_FULL.filter((t) => t !== "24/7")) {
      const org = catalog(text);
      expect(getOrganizationOpenStatus(org, at(MON, "12:00")), text).toBe("unknown");
      expect(getHoursDisplay(org), text).toEqual({ kind: "listed", lines: [text] });
      expect(isOrganizationOpen(org, at(MON, "12:00")), text).toBe(true);
    }
  });

  test('"20:00–08:00" without days is not "every day"', () => {
    const org = catalog("20:00–08:00");
    for (const date of [at(MON, "23:30"), at(TUE, "07:30"), at(SAT, "02:00")]) {
      expect(getOrganizationOpenStatus(org, date)).toBe("unknown");
    }
  });

  test("OSM entries never go through the Russian parser", () => {
    const osm: Organization = { ...catalog("Пн–Пт 19:00–19:30"), id: "overpass-node-1" };
    expect(getOrganizationOpenStatus(osm, at(MON, "19:10"))).toBe("unknown");
  });
});
