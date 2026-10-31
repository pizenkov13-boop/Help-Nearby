"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  cacheDetectedCountry,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import { isSunnyRegionCountry } from "@/lib/sunnyRegions";
import { hasStoredThemePreference } from "@/lib/themePreference";

/**
 * On first visit (no saved theme preference), enable light mode in sunny
 * regions (Africa, Arabian Peninsula, hot Middle East). Manual toggle always wins.
 * The region is only taken from a country already found by an explicit search: this component
 * never asks the browser for the location (a prompt on page load, before any tap, trains people to
 * refuse it and blocks the real request).
 */
export function ThemeRegionSync() {
  const { setTheme } = useTheme();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current || typeof window === "undefined") return;
    if (hasStoredThemePreference()) return;

    const applyFromCountry = (country: string, countryCode: string | null) => {
      if (appliedRef.current || hasStoredThemePreference()) return;

      cacheDetectedCountry(country, countryCode);

      if (isSunnyRegionCountry(country, countryCode)) {
        appliedRef.current = true;
        setTheme("light");
      }
    };

    const cached = readCachedDetectedCountry();
    if (cached) {
      applyFromCountry(cached.country, cached.countryCode);
      return;
    }

  }, [setTheme]);

  return null;
}
