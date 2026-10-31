import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";

/** Every database call gets this long; a stuck call fails fast instead of hanging the route. */
export const DB_TIMEOUT_MS = 3_000;

/** fetch with a hard deadline (also honours a caller's own abort signal). */
export const timedFetch: typeof fetch = (input, init) => {
  const deadline = AbortSignal.timeout(DB_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
  return fetch(input, { ...init, signal });
};

export type DbFailureReason = "not_configured" | "timeout" | "network" | "forbidden" | "db_error";

/** Thrown by the strict query paths so a route can answer with an explicit error, not an empty list. */
export class DbUnavailableError extends Error {
  constructor(readonly reason: DbFailureReason) {
    super(`Database unavailable: ${reason}`);
  }
}

/** A short, secret-free reason code for logs and API error bodies. */
export function classifyDbFailure(error: unknown): DbFailureReason {
  if (error instanceof DbUnavailableError) return error.reason;
  const name = error instanceof Error ? error.name : "";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String((error as { message: unknown }).message) : "";
  if (name === "TimeoutError" || name === "AbortError" || /timed? ?out|aborted/i.test(message)) {
    return "timeout";
  }
  if (code === "42501" || /permission denied|row-level security|JWT|Invalid API key/i.test(message)) {
    return "forbidden";
  }
  if (isSupabaseFetchError(error)) return "network";
  return "db_error";
}

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
      global: { fetch: timedFetch },
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
    message.includes("NetworkError") ||
    message.includes("ENOTFOUND") ||
    message.includes("ERR_NAME_NOT_RESOLVED") ||
    message.includes("getaddrinfo") ||
    cause === "ENOTFOUND"
  );
}
