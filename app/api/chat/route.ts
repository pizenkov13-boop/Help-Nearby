import { NextResponse } from "next/server";
import { aiComplete, isAiConfigured, type AiMessage } from "@/lib/aiProvider.server";
import { detectCategory, extractPlaceQuery } from "@/lib/chatContext.server";
import { resolveSearchIntent } from "@/lib/chatIntent.server";
import {
  buildSystemPrompt,
  mergeResultsWithClientContext,
  SOURCE_DISPLAY_NAMES,
  sanitizeContextOrganizations,
} from "@/lib/chatPrompt.server";
import { consumeChatQuota, getClientIp } from "@/lib/chatRateLimit.server";
import type { ChatSearchOrg } from "@/lib/chatSearch";
import { searchForChat } from "@/lib/chatSearch.server";
import { LANGUAGES, translations } from "@/lib/i18n/translations";
import type { LanguageCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_TOKENS = 600;
const AI_TIMEOUT_MS = 20_000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

/** Fallback when the client does not send its UI language. */
function detectLanguage(text: string): LanguageCode {
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[؀-ۿ]/.test(text)) return "ar";
  return "en";
}

function errorResponse(
  key: "chatError" | "chatErrorTooLong" | "chatErrorRateLimit",
  language: LanguageCode,
  status: number,
) {
  return NextResponse.json({ error: translations[language][key] }, { status });
}

function parseLocation(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== "object") return null;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }
  return { lat, lng };
}

/** Plain-text answer used only when the LLM is unavailable. */
function formatFallback(orgs: ChatSearchOrg[], language: LanguageCode): string {
  const ru = language === "ru";
  if (orgs.length === 0) {
    return ru
      ? "Ничего не найдено ни в одном источнике. Попробуйте другой город или больший район, либо откройте карту и режим «Экстренная помощь»."
      : "Nothing was found in any source. Try another city or a larger area, or open the map and Emergency mode.";
  }
  const lines = orgs.slice(0, 5).map((o) => {
    const details = [o.city, o.phone, o.website].filter(Boolean).join(", ");
    const note = o.countryLevel
      ? ru
        ? " (справочник по стране, точный адрес не подтверждён)"
        : " (country-level directory, exact office address not confirmed)"
      : "";
    return `• ${o.name}${details ? ` — ${details}` : ""} [${SOURCE_DISPLAY_NAMES[o.source] ?? o.source}]${note}`;
  });
  return [ru ? "Помощь рядом:" : "Help nearby:", ...lines].join("\n");
}

export async function POST(request: Request) {
  if (!consumeChatQuota(getClientIp(request))) {
    return errorResponse("chatErrorRateLimit", "en", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as {
    messages?: ChatMessage[];
    language?: unknown;
    context?: {
      country?: unknown;
      location?: unknown;
      organizations?: unknown;
    };
  };

  const messages = payload.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  const validMessages = messages
    .filter(
      (m): m is ChatMessage =>
        m != null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .slice(-MAX_HISTORY_MESSAGES);

  if (validMessages.length === 0) {
    return NextResponse.json({ error: "No valid messages." }, { status: 400 });
  }

  const lastUserMessage = [...validMessages]
    .reverse()
    .find((message) => message.role === "user");
  const userQuery = lastUserMessage?.content ?? "";

  const language = isLanguageCode(payload.language)
    ? payload.language
    : detectLanguage(userQuery);

  if (userQuery.length > MAX_INPUT_CHARS) {
    return errorResponse("chatErrorTooLong", language, 400);
  }

  const history: ChatMessage[] = validMessages.map((m) => ({
    ...m,
    content: m.content.slice(0, MAX_INPUT_CHARS),
  }));
  const priorMessages = history.slice(0, -1);

  try {
    const intent = await resolveSearchIntent(priorMessages, userQuery);
    const category = intent.category ?? detectCategory(userQuery);
    const place = intent.place ?? extractPlaceQuery(userQuery);

    const clientCountry =
      typeof payload.context?.country === "string"
        ? payload.context.country.slice(0, 60)
        : "";

    // The server searches every source itself, independent of the page's own search.
    const search = await searchForChat({
      place,
      category,
      clientLocation: parseLocation(payload.context?.location),
      clientCountry: clientCountry || null,
    });

    const results = mergeResultsWithClientContext(
      search.organizations,
      sanitizeContextOrganizations(payload.context?.organizations),
    );

    if (!isAiConfigured()) {
      console.error("[chat] fallback: no api key");
      return NextResponse.json({ message: formatFallback(results, language) });
    }

    const aiMessages: AiMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(
          results,
          search.country ?? clientCountry,
          search.searched,
        ),
      },
      ...history,
    ];
    const reply = await aiComplete(aiMessages, {
      temperature: 0.3,
      maxTokens: MAX_TOKENS,
      timeoutMs: AI_TIMEOUT_MS,
    });

    if (reply) return NextResponse.json({ message: reply });

    // The provider-level reason was already logged by aiComplete.
    return NextResponse.json({ message: formatFallback(results, language) });
  } catch (error) {
    console.error(
      "[chat] Failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return errorResponse("chatError", language, 500);
  }
}
