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

export type AiResult =
  | { ok: true; text: string }
  | { ok: false; reason: string; status: number };

/**
 * Chat completion against the OpenAI-compatible AITunnel API.
 * Logs only the failure reason (no key, request body or response body).
 */
export async function aiCompleteDetailed(
  messages: AiMessage[],
  { maxTokens, temperature, timeoutMs }: AiCompleteOptions,
): Promise<AiResult> {
  const fail = (reason: string, status = 0): AiResult => {
    console.error(`[ai] fallback: ${reason}`);
    return { ok: false, reason, status };
  };

  const { apiKey, baseUrl, model } = getAiConfig();
  if (!apiKey) return fail("no api key");

  const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(url, {
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
  } catch (error) {
    return fail(
      error instanceof Error && error.name === "TimeoutError"
        ? "timeout"
        : "network error",
    );
  }

  if (!res.ok) return fail(`http ${res.status}`, res.status);

  try {
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text ? { ok: true, text } : fail("parse error (empty content)", res.status);
  } catch {
    return fail("parse error (invalid json)", res.status);
  }
}

/** Returns the reply text, or null on any failure (reason is logged). */
export async function aiComplete(
  messages: AiMessage[],
  options: AiCompleteOptions,
): Promise<string | null> {
  const result = await aiCompleteDetailed(messages, options);
  return result.ok ? result.text : null;
}
