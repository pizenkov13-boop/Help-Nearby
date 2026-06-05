import "server-only";

let envLoaded = false;

/** Server env accessors. Edge/Cloudflare inject vars at runtime; Next.js loads .env.local in dev. */
export function ensureEnvLoaded() {
  envLoaded = true;
}

export function getGroqApiKey(): string | undefined {
  ensureEnvLoaded();
  const key = process.env.GROQ_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}
