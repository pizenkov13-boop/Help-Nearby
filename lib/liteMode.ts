/** Network Information API (experimental; not in all browsers). */
export interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  saveData?: boolean;
  addEventListener?(type: "change", listener: () => void): void;
  removeEventListener?(type: "change", listener: () => void): void;
}

/** Fallback when navigator.connection is unavailable. */
const SLOW_INTERNET_COUNTRY_NAMES = new Set([
  "sudan",
  "yemen",
  "afghanistan",
  "haiti",
  "syria",
  "somalia",
  "chad",
  "niger",
  "mali",
  "burkina faso",
  "central african republic",
  "eritrea",
  "burundi",
  "mozambique",
  "sierra leone",
  "guinea-bissau",
  "liberia",
  "madagascar",
  "malawi",
  "rwanda",
  "south sudan",
  "togo",
  "democratic republic of the congo",
  "dem. rep. congo",
  "dr congo",
  "congo, the democratic republic of the",
  "congo, democratic republic of the",
]);

const SLOW_INTERNET_COUNTRY_CODES = new Set([
  "sd", // Sudan
  "ye", // Yemen
  "af", // Afghanistan
  "cd", // DRC
  "ht", // Haiti
  "sy", // Syria
  "so", // Somalia
  "td", // Chad
  "ne", // Niger
  "ml", // Mali
  "bf", // Burkina Faso
  "cf", // Central African Republic
  "er", // Eritrea
  "bi", // Burundi
  "mz", // Mozambique
  "sl", // Sierra Leone
  "gw", // Guinea-Bissau
  "lr", // Liberia
  "mg", // Madagascar
  "mw", // Malawi
  "rw", // Rwanda
  "ss", // South Sudan
  "tg", // Togo
]);

export const LITE_MODE_STORAGE_KEY = "help-nearby-view-mode";
export const SLOW_FETCH_THRESHOLD_MS = 2200;

export type ViewModePreference = "lite" | "full";

export function normalizeCountryName(country: string): string {
  return country.trim().toLowerCase();
}

export function getNetworkConnection(): NetworkInformation | null {
  if (typeof navigator === "undefined") return null;

  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };

  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

/** True when connection quality warrants lite mode. */
export function isSlowNetworkConnection(
  connection: NetworkInformation | null,
): boolean {
  if (!connection) return false;

  if (connection.saveData) {
    return true;
  }

  if (!connection.effectiveType) return false;

  const { effectiveType } = connection;

  if (
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g"
  ) {
    return true;
  }

  return false;
}

/**
 * Detect slow connection from Network API.
 * Returns null when the API is unavailable (use country fallback).
 */
export function detectSlowConnectionFromNetwork(): boolean | null {
  const connection = getNetworkConnection();
  if (
    !connection ||
    (connection.effectiveType === undefined && connection.saveData === undefined)
  ) {
    return null;
  }

  return isSlowNetworkConnection(connection);
}

export function isSlowInternetCountry(
  country: string | null | undefined,
  countryCode?: string | null,
): boolean {
  if (countryCode) {
    const code = countryCode.trim().toLowerCase();
    if (SLOW_INTERNET_COUNTRY_CODES.has(code)) return true;
  }

  if (!country) return false;

  const normalized = normalizeCountryName(country);

  if (SLOW_INTERNET_COUNTRY_NAMES.has(normalized)) return true;

  return (
    normalized.includes("democratic republic") &&
    normalized.includes("congo")
  );
}

/** Subscribe to network changes; returns cleanup. */
export function subscribeToNetworkChanges(
  onChange: (slow: boolean) => void,
): () => void {
  const connection = getNetworkConnection();
  if (!connection?.addEventListener || connection.effectiveType === undefined) {
    return () => {};
  }

  const handler = () => {
    onChange(isSlowNetworkConnection(connection));
  };

  connection.addEventListener("change", handler);
  return () => connection.removeEventListener?.("change", handler);
}

export function getStoredViewMode(): ViewModePreference | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(LITE_MODE_STORAGE_KEY);
  if (value === "lite" || value === "full") return value;
  return null;
}

export function setStoredViewMode(mode: ViewModePreference): void {
  sessionStorage.setItem(LITE_MODE_STORAGE_KEY, mode);
}

export function shouldUseLiteMode(
  detectedSlowConnection: boolean,
  preference: ViewModePreference | null,
): boolean {
  if (preference === "full") return false;
  if (preference === "lite") return true;
  return detectedSlowConnection;
}

/**
 * Fetch duration fallback for browsers where navigator.connection
 * is missing or does not reflect throttled/devtools conditions.
 */
export function isSlowMeasuredFetch(durationMs: number): boolean {
  return durationMs >= SLOW_FETCH_THRESHOLD_MS;
}
