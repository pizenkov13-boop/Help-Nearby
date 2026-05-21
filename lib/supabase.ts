import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";

let warnedMissing = false;
let warnedUnreachable = false;
let client: SupabaseClient | null = null;

function warnMissingConfig() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    "[supabase] Missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
}

function warnUnreachableHost(hostname: string) {
  if (warnedUnreachable) return;
  warnedUnreachable = true;
  console.warn(
    `[supabase] Host "${hostname}" does not resolve (ENOTFOUND). ` +
      "Update NEXT_PUBLIC_SUPABASE_URL in .env.local to your active Supabase project URL, then restart the dev server.",
  );
}

/** True when URL/key are set and URL looks like a Supabase project host. */
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      /\.supabase\.co$/i.test(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function getSupabaseConfigStatus(): {
  configured: boolean;
  hostname: string | null;
} {
  const { url } = getSupabasePublicEnv();
  if (!url) {
    return { configured: false, hostname: null };
  }
  try {
    return {
      configured: isSupabaseConfigured(),
      hostname: new URL(url).hostname,
    };
  } catch {
    return { configured: false, hostname: null };
  }
}

/** Returns null when Supabase is not configured — callers should show empty state. */
export function getSupabase(): SupabaseClient | null {
  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabasePublicEnv();

  if (!isSupabaseConfigured()) {
    warnMissingConfig();
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

export function isSupabaseFetchError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof TypeError) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : typeof error === "object" &&
          error !== null &&
          "cause" in error &&
          typeof (error as { cause: unknown }).cause === "object" &&
          (error as { cause: { code?: string } }).cause?.code
        ? String((error as { cause: { code?: string } }).cause.code)
        : "";

  if (cause === "ENOTFOUND" || message.includes("ENOTFOUND")) {
    const { hostname } = getSupabaseConfigStatus();
    if (hostname) warnUnreachableHost(hostname);
  }

  return (
    message.includes("fetch failed") ||
    message.includes("Failed to fetch") ||
    message.includes("ENOTFOUND") ||
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.includes("getaddrinfo") ||
    cause === "ENOTFOUND"
  );
}
