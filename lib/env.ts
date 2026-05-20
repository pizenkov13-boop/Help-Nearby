import { loadEnvConfig } from "@next/env";

let envLoaded = false;

/** Ensures .env.local is loaded (needed in some dev/API route contexts). */
export function ensureEnvLoaded() {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
}

export function getGroqApiKey(): string | undefined {
  ensureEnvLoaded();
  const key = process.env.GROQ_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}
