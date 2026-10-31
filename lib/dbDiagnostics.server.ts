import "server-only";

export interface DbDiagnosis {
  /** Node/undici error code of the underlying failure (ENOTFOUND, ETIMEDOUT, UND_ERR_CONNECT_TIMEOUT, ...). */
  causeCode: string | null;
  /** Error name and message with the project host masked; no keys, no URLs. */
  message: string;
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
 * Why a database call failed, safe to return in an error body: error code and message only.
 * No DNS lookup here: resolving a dead host is exactly what hangs for ~7 s on Vercel.
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

  return { causeCode: errorCode(cause) ?? errorCode(error), message: maskHost(raw) };
}
