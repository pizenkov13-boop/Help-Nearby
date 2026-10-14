import "server-only";

import { getAiConfig } from "@/lib/env.server";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompleteOptions {
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export function isAiConfigured(): boolean {
  return Boolean(getAiConfig().apiKey);
}

/**
 * Chat completion against the OpenAI-compatible AITunnel API.
 * Returns null on any provider failure; never logs the key or response bodies.
 */
export async function aiComplete(
  messages: AiMessage[],
  { maxTokens, temperature, timeoutMs }: AiCompleteOptions,
): Promise<string | null> {
  const { apiKey, baseUrl, model } = getAiConfig();
  if (!apiKey) return null;

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      console.error(`[ai] Provider responded with HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? "timeout"
        : "network error";
    console.error(`[ai] Request failed: ${reason}`);
    return null;
  }
}
