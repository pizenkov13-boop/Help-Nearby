import "server-only";

import { lookup } from "node:dns/promises";
import { getSupabasePublicEnv } from "@/lib/env";

export interface DbDiagnosis {
  /** Node/undici error code of the underlying failure (ENOTFOUND, ETIMEDOUT, UND_ERR_CONNECT_TIMEOUT, ...). */
  causeCode: string | null;
  /** Error name and message with the project host masked; no keys, no URLs. */
  message: string;
  /** Whether the configured Supabase host resolves from this server: "ok", an error code, or "no_url". */
  dns: string;
}

const maskHost = (text: string) =>
  text
    .replace(/[a-z0-9-]+\.supabase\.(co|in)/gi, "<project>.supabase.$1")
    .replace(/https?:\/\/\S+/gi, "<url>")
    .slice(0, 200);

function errorCode(value: unknown): string | null {
  if (typeof value === "object" && value !== null && "code" in value) {
    const code = (value as { code: unknown }).code;
    return typeof code === "string" && code ? code : null;
  }
  return null;
}

/**
 * Why a database call failed, safe to return in an error body: error codes and a DNS check only.
 * Never includes the host name, keys or query strings.
 */
export async function diagnoseDbFailure(error: unknown): Promise<DbDiagnosis> {
  const cause = error instanceof Error ? error.cause : undefined;
  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "object" && error !== null && "message" in error
        ? `${String((error as { message: unknown }).message)} ${String((error as { details?: unknown }).details ?? "")}`
        : String(error);

  let dns = "no_url";
  const { url } = getSupabasePublicEnv();
  if (url) {
    try {
      const host = new URL(url).hostname;
      await Promise.race([
        lookup(host),
        new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("dns timeout"), { code: "DNS_TIMEOUT" })), 2_000)),
      ]);
      dns = "ok";
    } catch (dnsError) {
      dns = errorCode(dnsError) ?? "error";
    }
  }

  return { causeCode: errorCode(cause) ?? errorCode(error), message: maskHost(raw), dns };
}
