import { NextResponse } from "next/server";
import { aiComplete, isAiConfigured, type AiMessage } from "@/lib/aiProvider.server";
import {
  findOrganizationsForChat,
  formatChatReply,
  formatFollowUpFallback,
} from "@/lib/chatContext.server";
import { resolveSearchIntent } from "@/lib/chatIntent.server";
import {
  buildSystemPrompt,
  MAX_CONTEXT_ORGS,
  organizationToContext,
  sanitizeContextOrganizations,
} from "@/lib/chatPrompt.server";
import { consumeChatQuota, getClientIp } from "@/lib/chatRateLimit.server";
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
    context?: { country?: unknown; organizations?: unknown };
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

    const dbOrganizations =
      intent.place || intent.category
        ? await findOrganizationsForChat(userQuery, 6, intent)
        : [];

    // Client-side search results first (what the user currently sees), then DB matches.
    const contextOrgs = sanitizeContextOrganizations(payload.context?.organizations);
    const seen = new Set(contextOrgs.map((o) => o.name.toLowerCase()));
    for (const org of dbOrganizations) {
      if (contextOrgs.length >= MAX_CONTEXT_ORGS) break;
      if (seen.has(org.name.toLowerCase())) continue;
      seen.add(org.name.toLowerCase());
      contextOrgs.push(organizationToContext(org));
    }

    const country =
      typeof payload.context?.country === "string"
        ? payload.context.country.slice(0, 60)
        : "";

    const fallback = () =>
      dbOrganizations.length > 0
        ? formatChatReply(dbOrganizations, userQuery, intent)
        : null;

    if (!isAiConfigured()) {
      return NextResponse.json({
        message:
          fallback() ?? formatFollowUpFallback(userQuery, dbOrganizations),
      });
    }

    const aiMessages: AiMessage[] = [
      { role: "system", content: buildSystemPrompt(contextOrgs, country) },
      ...history,
    ];
    const reply = await aiComplete(aiMessages, {
      temperature: 0.3,
      maxTokens: MAX_TOKENS,
      timeoutMs: AI_TIMEOUT_MS,
    });

    if (reply) return NextResponse.json({ message: reply });

    const direct = fallback();
    if (direct) return NextResponse.json({ message: direct });
    return errorResponse("chatError", language, 502);
  } catch (error) {
    console.error(
      "[chat] Failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return errorResponse("chatError", language, 500);
  }
}
