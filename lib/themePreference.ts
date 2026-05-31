export const THEME_STORAGE_KEY = "help-nearby-theme";

/** True when the user has chosen a theme (toggle) or next-themes persisted a value. */
export function hasStoredThemePreference(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(THEME_STORAGE_KEY) !== null;
}
