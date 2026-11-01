import "server-only";

import pkg from "../package.json";
import { MAIN_SITE_URL } from "@/lib/siteConfig";

const PING_URL = `${MAIN_SITE_URL}/api/deployments`;
const MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
let lastSentAt = 0;

export type PingResult = "sent" | "disabled" | "main-site" | "throttled" | "failed";

/**
 * Anonymous, opt-out deployment ping: this deployment's hostname, the app version and a timestamp.
 * No visitor data, no search queries. Disable with DISABLE_PING=true.
 */
export async function sendDeploymentPing(hostname: string): Promise<PingResult> {
  if (process.env.DISABLE_PING?.trim().toLowerCase() === "true") return "disabled";

  const domain = hostname.trim().toLowerCase().replace(/:\d+$/, "");
  const mainHost = new URL(MAIN_SITE_URL).hostname;
  if (domain === mainHost || domain === "help-nearby.org") return "main-site";

  const now = Date.now();
  if (now - lastSentAt < MIN_INTERVAL_MS) return "throttled";

  try {
    const response = await fetch(PING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        version: pkg.version,
        timestamp: new Date(now).toISOString(),
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(`[ping] HTTP ${response.status}`);
      return "failed";
    }
    lastSentAt = now;
    return "sent";
  } catch {
    return "failed";
  }
}
