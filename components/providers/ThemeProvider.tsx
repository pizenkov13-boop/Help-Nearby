"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, type ReactNode } from "react";
import { THEME_STORAGE_KEY } from "@/lib/themePreference";

/** True when the server saw a visitor from a SUNNY_COUNTRY_CODES country: "Auto" then starts light. */
const SunnyCountryContext = createContext(false);

export function useSunnyCountry(): boolean {
  return useContext(SunnyCountryContext);
}

/**
 * "Auto" is "no saved choice". Its default is light in sunny countries and the device setting elsewhere;
 * a saved light/dark choice always wins (next-themes reads it first, the default only applies without one).
 */
export function ThemeProvider({ children, sunnyCountry = false }: { children: ReactNode; sunnyCountry?: boolean }) {
  return (
    <SunnyCountryContext.Provider value={sunnyCountry}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={sunnyCountry ? "light" : "system"}
        enableSystem
        storageKey={THEME_STORAGE_KEY}
        disableTransitionOnChange={false}
      >
        {children}
      </NextThemesProvider>
    </SunnyCountryContext.Provider>
  );
}
