import { NextResponse } from "next/server";
import {
  buildContextSearchQuery,
  buildFollowUpSystemPrompt,
  findOrganizationsForChat,
  formatChatReply,
  formatFollowUpFallback,
  shouldUseDirectSearch,
} from "@/lib/chatContext.server";
import { parseSearchIntent } from "@/lib/chatIntent.server";
import { getGroqApiKey } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function askGroqFollowUp(
  systemPrompt: string,
  messages: ChatMessage[],
  apiKey: string,
): Promise<string | null> {
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
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.3,
        max_tokens: 280,
      }),
    },
  );

  if (!groqResponse.ok) {
    console.error("[chat] Groq error:", await groqResponse.text());
    return null;
  }

  const data = (await groqResponse.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = (body as { messages?: ChatMessage[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages are required." }, { status: 400 });
  }

  const validMessages = messages.filter(
    (m): m is ChatMessage =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );

  if (validMessages.length === 0) {
    return NextResponse.json({ error: "No valid messages." }, { status: 400 });
  }

  const lastUserMessage = [...validMessages]
    .reverse()
    .find((message) => message.role === "user");

  const userQuery = lastUserMessage?.content ?? "";
  const apiKey = getGroqApiKey();

  try {
    if (shouldUseDirectSearch(validMessages, userQuery)) {
      const intent = await parseSearchIntent(userQuery, apiKey);
      const organizations = await findOrganizationsForChat(
        userQuery,
        6,
        intent,
      );
      return NextResponse.json({
        message: formatChatReply(organizations, userQuery, intent),
      });
    }

    const priorMessages = validMessages.slice(0, -1);
    const contextQuery = buildContextSearchQuery(priorMessages, userQuery);
    const contextIntent = await parseSearchIntent(contextQuery, apiKey);
    const organizations = await findOrganizationsForChat(
      contextQuery,
      6,
      contextIntent,
    );

    if (!apiKey) {
      return NextResponse.json({
        message: formatFollowUpFallback(userQuery, organizations),
      });
    }

    const systemPrompt = buildFollowUpSystemPrompt(organizations, contextQuery);
    const reply = await askGroqFollowUp(systemPrompt, validMessages, apiKey);

    if (!reply) {
      return NextResponse.json({
        message: formatFollowUpFallback(userQuery, organizations),
      });
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[chat] Failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
