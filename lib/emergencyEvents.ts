export const EMERGENCY_OPEN_EVENT = "hn:emergency-open";

export function openEmergencyHelp() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EMERGENCY_OPEN_EVENT));
  }
}
