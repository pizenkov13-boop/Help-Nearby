import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/env";

/** Every database call gets this long; a stuck call fails fast instead of hanging the route. */
export const DB_TIMEOUT_MS = 3_000;

/** After this many failures in a row the database is treated as down for DB_BREAKER_MS. */
const DB_BREAKER_FAILURES = 2;
export const DB_BREAKER_MS = 20_000;
let consecutiveDbFailures = 0;
let dbDownUntil = 0;

/** Test hook: forget earlier failures. */
export function resetDbBreaker(): void {
  consecutiveDbFailures = 0;
  dbDownUntil = 0;
}

/**
 * fetch with a hard deadline that is enforced by racing a timer (a stuck DNS lookup ignores the abort
 * signal and took 7 s to fail), plus a small circuit breaker: when the database keeps failing, the next
 * calls fail at once for a few seconds instead of each waiting for the deadline.
 */
export const timedFetch: typeof fetch = async (input, init) => {
  if (Date.now() < dbDownUntil) {
    throw new TypeError("fetch failed (database unreachable, retrying shortly)");
  }

  const deadline = AbortSignal.timeout(DB_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(Object.assign(new Error("Database request timed out"), { name: "TimeoutError" })),
      DB_TIMEOUT_MS,
    );
  });

  try {
    const response = await Promise.race([fetch(input, { ...init, signal }), expired]);
    consecutiveDbFailures = 0;
    return response;
  } catch (error) {
    consecutiveDbFailures += 1;
    if (consecutiveDbFailures >= DB_BREAKER_FAILURES) dbDownUntil = Date.now() + DB_BREAKER_MS;
    throw error;
  } finally {
    clearTimeout(timer);
  }
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

/**
 * The one place Supabase clients are created. postgrest-js retries a failed GET/HEAD three times
 * with 1 s, 2 s and 4 s pauses: when the database host is unreachable every request then took a
 * fixed 7 s before failing. A page request cannot wait that long, so retries are switched off
 * (the breaker above already stops repeated attempts). supabase-js does not expose the option, so
 * it is set on the REST client it builds; a test checks it still takes effect after upgrades.
 */
export function createDbClient(url: string, key: string): SupabaseClient {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
  const rest = (client as unknown as { rest?: { retry?: boolean } }).rest;
  if (rest) rest.retry = false;
  return client;
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
    client = createDbClient(supabaseUrl, supabaseAnonKey);
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
