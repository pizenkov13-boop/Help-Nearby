import "server-only";

import {
  detectCategory,
  extractPlaceQuery,
  type SearchIntent,
} from "@/lib/chatContext.server";

export type { SearchIntent };

const GROQ_MODEL = "llama-3.3-70b-versatile";

const VALID_CATEGORIES = new Set([
  "food",
  "shelter",
  "medical",
  "clothing",
  "volunteer",
]);

function sanitizePlace(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const place = value.trim();
  if (place.length < 3) return null;
  if (place.toLowerCase() === "null") return null;
  return place;
}

function sanitizeCategory(value: unknown): SearchIntent["category"] {
  if (typeof value !== "string") return null;
  const category = value.trim().toLowerCase();
  return VALID_CATEGORIES.has(category)
    ? (category as SearchIntent["category"])
    : null;
}

function parseIntentJson(raw: string): SearchIntent | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      category?: unknown;
      place?: unknown;
    };
    return {
      category: sanitizeCategory(parsed.category),
      place: sanitizePlace(parsed.place),
    };
  } catch {
    return null;
  }
}

async function parseIntentWithGroq(
  query: string,
  apiKey: string,
): Promise<SearchIntent | null> {
  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You extract search intent for a humanitarian help finder app.
Reply with ONLY valid JSON, no markdown:
{"category":"food|shelter|medical|clothing|volunteer|null","place":"city or null"}

Rules:
- Understand any phrasing/language (e.g. "хочу есть", "where to eat", "need shelter").
- category = type of help needed; null if unclear.
- place = city/town/area name ONLY if the user mentioned one; otherwise null.
- Never invent a place. Never add explanation.`,
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 80,
      }),
    },
  );

  if (!groqResponse.ok) {
    console.error("[chat/intent] Groq error:", await groqResponse.text());
    return null;
  }

  const data = (await groqResponse.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  return parseIntentJson(content);
}

function parseIntentWithKeywords(query: string): SearchIntent {
  return {
    category: detectCategory(query),
    place: extractPlaceQuery(query),
  };
}

/** Groq understands any wording; keywords are fallback without API key. */
export async function parseSearchIntent(
  query: string,
  apiKey?: string,
): Promise<SearchIntent> {
  if (apiKey) {
    const groqIntent = await parseIntentWithGroq(query, apiKey);
    if (groqIntent) {
      return {
        category: groqIntent.category ?? detectCategory(query),
        place: groqIntent.place ?? extractPlaceQuery(query),
      };
    }
  }

  return parseIntentWithKeywords(query);
}
