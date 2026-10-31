/** Network Information API (experimental; not in all browsers). */
export interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  saveData?: boolean;
  addEventListener?(type: "change", listener: () => void): void;
  removeEventListener?(type: "change", listener: () => void): void;
}

/**
 * Lite mode switches on by itself only for signals that come from the visitor's own browser:
 * navigator.connection.saveData === true, or effectiveType "slow-2g" / "2g". Nothing we measure on
 * our own servers (response times of /api/*, cold starts, region) and no country list is used, they
 * say nothing about the visitor's connection. Without the Network Information API it stays off.
 * The visitor can always switch by hand; that choice is kept in localStorage (no cookies).
 */
export const LITE_MODE_STORAGE_KEY = "help-nearby-view-mode";

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

/** True when the browser itself reports Data Saver or a 2G-class connection. */
export function isSlowNetworkConnection(
  connection: NetworkInformation | null,
): boolean {
  if (!connection) return false;
  if (connection.saveData === true) return true;
  return connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}

/** Current Network Information verdict; false when the API is missing. */
export function detectSlowConnectionFromNetwork(): boolean {
  return isSlowNetworkConnection(getNetworkConnection());
}

/** Subscribe to network changes; returns cleanup. */
export function subscribeToNetworkChanges(
  onChange: (slow: boolean) => void,
): () => void {
  const connection = getNetworkConnection();
  if (!connection?.addEventListener) {
    return () => {};
  }

  const handler = () => {
    onChange(isSlowNetworkConnection(connection));
  };

  connection.addEventListener("change", handler);
  return () => connection.removeEventListener?.("change", handler);
}

export function getStoredViewMode(): ViewModePreference | null {
  try {
    const value = window.localStorage.getItem(LITE_MODE_STORAGE_KEY);
    if (value === "lite" || value === "full") return value;
  } catch {
    // Storage blocked (private mode, site data off): no remembered choice.
  }
  return null;
}

export function setStoredViewMode(mode: ViewModePreference): void {
  try {
    window.localStorage.setItem(LITE_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
}

export function shouldUseLiteMode(
  detectedSlowConnection: boolean,
  preference: ViewModePreference | null,
): boolean {
  if (preference === "full") return false;
  if (preference === "lite") return true;
  return detectedSlowConnection;
}
