"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  cacheDetectedCountry,
  readCachedDetectedCountry,
} from "@/lib/detectedCountry";
import { reverseGeocodeCountry } from "@/lib/geocode";
import { isSunnyRegionCountry } from "@/lib/sunnyRegions";
import { hasStoredThemePreference } from "@/lib/themePreference";

/**
 * On first visit (no saved theme preference), enable light mode in sunny
 * regions (Africa, Arabian Peninsula, hot Middle East). Manual toggle always wins.
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

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const geo = await reverseGeocodeCountry(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (!geo) return;
        applyFromCountry(geo.country, geo.countryCode);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 86400000 },
    );
  }, [setTheme]);

  return null;
}
