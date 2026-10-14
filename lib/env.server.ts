import "server-only";

let envLoaded = false;

/** Server env accessors. Edge/Cloudflare inject vars at runtime; Next.js loads .env.local in dev. */
export function ensureEnvLoaded() {
  envLoaded = true;
}

export interface AiConfig {
  apiKey: string | undefined;
  baseUrl: string;
  model: string;
}

/** AITunnel (OpenAI-compatible) settings. The key is server-side only. */
export function getAiConfig(): AiConfig {
  ensureEnvLoaded();
  const apiKey = process.env.AITUNNEL_API_KEY?.trim();
  const baseUrl =
    process.env.AITUNNEL_BASE_URL?.trim() || "https://api.aitunnel.ru/v1/";
  const model = process.env.AITUNNEL_MODEL?.trim() || "gpt-6-luna";
  return { apiKey: apiKey || undefined, baseUrl, model };
}
