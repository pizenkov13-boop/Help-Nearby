"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  cacheDetectedCountry,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import { isSunnyRegionCountry } from "@/lib/sunnyRegions";
import { clearStoredThemeChoice, hasStoredThemePreference } from "@/lib/themePreference";

/**
 * Fallback for the Auto theme: without a saved light/dark choice, a country found by an explicit search
 * (SUNNY_COUNTRY_CODES) switches the page to light. The server already does this for the visitor's own country
 * (Vercel header, see app/layout.tsx). Nothing is saved, so it stays Auto; a manual choice always wins.
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
        // setTheme saves its value; Auto must stay "nothing saved".
        clearStoredThemeChoice();
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
