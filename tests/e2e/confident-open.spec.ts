import { test, expect } from "@playwright/test";
import { isConfidentlyOpen } from "@/lib/confidentOpenStatus";
import { MOCK_NEARBY_ORGS } from "./helpers";
import type { Organization } from "@/lib/types";
const base = { ...MOCK_NEARBY_ORGS[0], id: "overpass-test", hours: {}, hoursRaw: "Mo-Fr 09:00-17:00" } as Organization;

test("open-now uses the organization's time zone", () => {
  const instant = new Date("2026-11-23T15:00:00Z");
  expect(isConfidentlyOpen({ ...base, lat: 48.8566, lng: 2.3522 }, instant)).toBe(true);
  expect(isConfidentlyOpen({ ...base, lat: 35.6762, lng: 139.6503 }, instant)).toBe(false);
});

test("ambiguous schedules and unknown location are not treated as open", () => {
  const instant = new Date("2026-11-23T10:00:00Z");
  const paris = { ...base, lat: 48.8566, lng: 2.3522 };
  expect(isConfidentlyOpen({ ...paris, hoursRaw: "24/7; PH off" }, instant)).toBe(false);
  expect(isConfidentlyOpen({ ...paris, hoursRaw: "Mo-Fr 09:00-17:00; PH off" }, instant)).toBe(false);
  expect(isConfidentlyOpen({ ...paris, hoursRaw: "Mo 22:00-02:00" }, instant)).toBe(false);
  expect(isConfidentlyOpen({ ...paris, lat: 0, lng: 0 }, instant)).toBe(false);
  expect(isConfidentlyOpen({ ...paris, hoursRaw: "24/7" }, instant)).toBe(true);
});
