export const THEME_STORAGE_KEY = "help-nearby-theme";

export type ThemeChoice = "auto" | "light" | "dark";

/** True when the user has chosen light or dark by hand (Auto keeps nothing in storage). */
export function hasStoredThemePreference(): boolean {
  return readStoredThemeChoice() !== "auto";
}

/** The saved choice; anything else (nothing, "system", junk) is Auto. */
export function readStoredThemeChoice(): ThemeChoice {
  try {
    if (typeof localStorage === "undefined") return "auto";
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "auto";
  } catch {
    return "auto";
  }
}

/**
 * Switches back to Auto: the theme goes to the automatic one (light in sunny countries, the device
 * setting elsewhere) and the saved choice is deleted, so a manual choice is the only thing ever stored.
 */
export function clearStoredThemeChoice(): void {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* storage blocked: Auto simply stays for this page view */
  }
}
