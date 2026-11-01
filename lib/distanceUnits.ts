"use client";

import { useEffect, useState } from "react";
import {
  DETECTED_COUNTRY_EVENT,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import type { LanguageCode } from "@/lib/types";

export type DistanceUnit = "km" | "mi";

/** Countries that measure road distance in miles. */
const MILE_COUNTRY_CODES = new Set(["US", "GB", "LR", "MM"]);
const MILE_COUNTRY_NAMES = new Set([
  "united states",
  "united states of america",
  "usa",
  "united kingdom",
  "great britain",
  "uk",
  "liberia",
  "myanmar",
  "burma",
]);

export function unitForCountry(country?: string | null, countryCode?: string | null): DistanceUnit | null {
  if (countryCode) return MILE_COUNTRY_CODES.has(countryCode.toUpperCase()) ? "mi" : "km";
  if (country) return MILE_COUNTRY_NAMES.has(country.trim().toLowerCase()) ? "mi" : "km";
  return null;
}

/** "en-GB" -> "GB". Locales without a region say nothing about the country. */
export function unitForLocales(locales: readonly string[]): DistanceUnit | null {
  for (const tag of locales) {
    const region = tag.split(/[-_]/).slice(1).find((part) => /^[A-Za-z]{2}$/.test(part));
    if (region) return unitForCountry(null, region);
  }
  return null;
}

/**
 * Where the person is searching decides first (the place the results are for), then the region of
 * the browser's language; kilometres when neither says anything.
 */
export function detectDistanceUnit(): DistanceUnit {
  const cached = readCachedDetectedCountry();
  const fromCountry = cached ? unitForCountry(cached.country, cached.countryCode) : null;
  if (fromCountry) return fromCountry;
  if (typeof navigator === "undefined") return "km";
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  return unitForLocales(locales) ?? "km";
}

/** One unit for the whole interface: list label, cards, Emergency and the organization page. */
export function useDistanceUnit(): DistanceUnit {
  const [unit, setUnit] = useState<DistanceUnit>("km");
  useEffect(() => {
    const update = () => setUnit(detectDistanceUnit());
    update();
    window.addEventListener(DETECTED_COUNTRY_EVENT, update);
    return () => window.removeEventListener(DETECTED_COUNTRY_EVENT, update);
  }, []);
  return unit;
}

const UNIT_LABELS: Record<LanguageCode, { km: string; m: string; mi: string; ft: string }> = {
  en: { km: "km", m: "m", mi: "mi", ft: "ft" },
  ru: { km: "км", m: "м", mi: "миль", ft: "фт" },
  es: { km: "km", m: "m", mi: "mi", ft: "ft" },
  fr: { km: "km", m: "m", mi: "mi", ft: "ft" },
  de: { km: "km", m: "m", mi: "mi", ft: "ft" },
  zh: { km: "公里", m: "米", mi: "英里", ft: "英尺" },
  ar: { km: "كم", m: "م", mi: "ميل", ft: "قدم" },
};

const MILES_PER_KM = 0.621371;
const KM_PER_MILE = 1.609344;

/** Value from lib/geo ("0.5 mi", "300 ft") -> miles, or null when it is not in that format. */
export function parseDistanceMiles(distance: string): number | null {
  const match = distance.trim().match(/^([\d.]+)\s*(mi|ft)$/i);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  return match[2].toLowerCase() === "ft" ? value / 5280 : value;
}

/** Distance for display, in the visitor's unit and language. */
export function formatDistance(distance: string, unit: DistanceUnit, language: LanguageCode): string {
  const miles = parseDistanceMiles(distance);
  if (miles == null) return distance;
  const labels = UNIT_LABELS[language] ?? UNIT_LABELS.en;
  if (unit === "mi") {
    return miles < 0.1
      ? `${Math.max(1, Math.round(miles * 5280))} ${labels.ft}`
      : `${miles.toFixed(1)} ${labels.mi}`;
  }
  const km = miles * KM_PER_MILE;
  return km < 0.1
    ? `${Math.max(1, Math.round(km * 1000))} ${labels.m}`
    : `${km.toFixed(1)} ${labels.km}`;
}

/** Search radius (given in km) in the visitor's unit: the number only, rounded to one decimal. */
export function radiusInUnit(km: number, unit: DistanceUnit): number {
  return unit === "mi" ? Math.round(km * MILES_PER_KM * 10) / 10 : km;
}

export function unitLabel(unit: DistanceUnit, language: LanguageCode): string {
  return (UNIT_LABELS[language] ?? UNIT_LABELS.en)[unit];
}
