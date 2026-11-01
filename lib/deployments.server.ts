import "server-only";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MAIN_SITE_URL } from "@/lib/siteConfig";

export const MAIN_HOSTNAMES = new Set(["help-nearby.org", new URL(MAIN_SITE_URL).hostname]);

const HOSTNAME_PATTERN = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$/;
export const MAX_PING_BODY_BYTES = 1024;
export const LIVE_WINDOW_DAYS = 7;

export interface DeploymentPing {
  domain: string;
  version: string;
  timestamp: string;
}

/** Strict allowlist validation: only a bare public hostname, a version string and an ISO timestamp. */
export function parseDeploymentPing(body: unknown): DeploymentPing | null {
  if (!body || typeof body !== "object") return null;
  const { domain, version, timestamp } = body as Record<string, unknown>;
  if (typeof domain !== "string" || typeof version !== "string" || typeof timestamp !== "string") {
    return null;
  }
  const host = domain.trim().toLowerCase();
  if (!HOSTNAME_PATTERN.test(host)) return null;
  if (MAIN_HOSTNAMES.has(host)) return null;
  if (!VERSION_PATTERN.test(version)) return null;
  const sent = Date.parse(timestamp);
  if (!Number.isFinite(sent) || Math.abs(Date.now() - sent) > 24 * 60 * 60 * 1000) return null;
  return { domain: host, version, timestamp: new Date(sent).toISOString() };
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

/** In-memory sliding window per IP (per server instance). Returns true when allowed. */
export function consumePingQuota(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return true;
}

/** domain is unique; first_seen stays, last_seen and version are refreshed. */
export async function recordDeployment(ping: DeploymentPing): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;
  const { error } = await client
    .from("deployments")
    .upsert(
      { domain: ping.domain, version: ping.version, last_seen: new Date().toISOString() },
      { onConflict: "domain" },
    );
  if (error) {
    console.error("[deployments] upsert failed:", error.message);
    return false;
  }
  return true;
}

export interface DeploymentRow {
  domain: string;
  version: string;
  first_seen: string;
  last_seen: string;
}

export async function listLiveDeployments(): Promise<DeploymentRow[] | null> {
  const client = getSupabaseAdmin();
  if (!client) return null;
  const since = new Date(Date.now() - LIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("deployments")
    .select("domain, version, first_seen, last_seen")
    .gte("last_seen", since)
    .order("last_seen", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("[deployments] list failed:", error.message);
    return null;
  }
  return (data ?? []) as DeploymentRow[];
}
