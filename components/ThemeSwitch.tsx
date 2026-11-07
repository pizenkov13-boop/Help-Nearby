"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useSunnyCountry } from "@/components/providers/ThemeProvider";
import { readCachedDetectedCountry } from "@/lib/detectedCountry";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { isSunnyRegionCountry } from "@/lib/sunnyRegions";
import { clearStoredThemeChoice, readStoredThemeChoice, type ThemeChoice } from "@/lib/themePreference";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { choice: "auto", labelKey: "themeOptionAuto" },
  { choice: "light", labelKey: "themeOptionLight" },
  { choice: "dark", labelKey: "themeOptionDark" },
] as const;

/**
 * Three explicit options: Auto, Light, Dark. Light/Dark are saved in localStorage and always win;
 * Auto saves nothing (light in sunny countries, the device setting elsewhere).
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const sunnyCountry = useSunnyCountry();
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => setChoice(readStoredThemeChoice()), []);

  const select = (next: ThemeChoice) => {
    setChoice(next);
    if (next === "auto") {
      const cached = readCachedDetectedCountry();
      const sunny = sunnyCountry || (cached ? isSunnyRegionCountry(cached.country, cached.countryCode) : false);
      setTheme(sunny ? "light" : "system");
      clearStoredThemeChoice(); // setTheme saves its value; Auto means nothing saved
      return;
    }
    setTheme(next);
  };

  return (
    <div className={cn("theme-switch", className)} role="radiogroup" aria-label={t("themeLabel")}>
      {OPTIONS.map(({ choice: option, labelKey }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={choice === option}
          data-theme-choice={option}
          className={cn("theme-switch-option", choice === option && "on")}
          onClick={() => select(option)}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
