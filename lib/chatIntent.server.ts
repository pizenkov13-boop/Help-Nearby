import "server-only";

import {
  detectCategory,
  extractPlaceQuery,
  type ChatTurn,
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
  if (place.length < 2) return null;
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

function buildIntentPrompt(priorUser: string[], currentQuery: string): string {
  if (priorUser.length === 0) return currentQuery;
  return `Earlier user messages: ${priorUser.join(" | ")}\nCurrent message: ${currentQuery}`;
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
- Understand any phrasing/language ("хочу есть", "where to eat", "а в Нью-Йорке").
- If the current message only adds a city, inherit category from earlier messages.
- category = type of help; null only if truly unclear.
- place = city/area if mentioned in current OR earlier messages; null if none.
- Never invent a place.`,
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 100,
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

function inheritCategoryFromHistory(
  priorUser: string[],
  currentQuery: string,
): SearchIntent["category"] {
  for (const query of [...priorUser].reverse()) {
    const category = detectCategory(query);
    if (category) return category;
  }
  return detectCategory(currentQuery);
}

function mergeIntentWithKeywords(
  intent: SearchIntent,
  priorUser: string[],
  currentQuery: string,
): SearchIntent {
  const place =
    intent.place ??
    extractPlaceQuery(currentQuery) ??
    priorUser.map(extractPlaceQuery).find(Boolean) ??
    null;

  let category =
    intent.category ??
    detectCategory(currentQuery) ??
    inheritCategoryFromHistory(priorUser, currentQuery);

  if (place && !category) {
    category = inheritCategoryFromHistory(priorUser, currentQuery);
  }

  return { category, place };
}

/** Groq + conversation context; keywords as fallback. */
export async function resolveSearchIntent(
  priorMessages: ChatTurn[],
  currentQuery: string,
  apiKey?: string,
): Promise<SearchIntent> {
  const priorUser = priorMessages
    .filter((message) => message.role === "user")
    .map((message) => message.content);

  const prompt = buildIntentPrompt(priorUser, currentQuery);

  if (apiKey) {
    const groqIntent = await parseIntentWithGroq(prompt, apiKey);
    if (groqIntent) {
      return mergeIntentWithKeywords(groqIntent, priorUser, currentQuery);
    }
  }

  return mergeIntentWithKeywords(
    { category: null, place: null },
    priorUser,
    currentQuery,
  );
}
