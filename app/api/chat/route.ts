import { NextResponse } from "next/server";
import { getGroqApiKey } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You are a helpful assistant for Help Nearby - a platform that helps people find free food, shelter, medical aid, clothing and volunteer opportunities. You help people in crisis find assistance near them. Be compassionate, helpful and concise. You support 7 languages: English, Russian, Spanish, French, German, Chinese, Arabic. Always respond in the same language the user writes in.";

const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    console.error(
      "[chat] GROQ_API_KEY missing. Ensure C:\\Help Nearby\\.env.local exists and restart `npm run dev`.",
    );
    return NextResponse.json(
      { error: "Chat service is not configured." },
      { status: 503 },
    );
  }

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

  try {
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
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...validMessages],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      },
    );

    if (!groqResponse.ok) {
      console.error("Groq API error:", await groqResponse.text());
      return NextResponse.json(
        { error: "Unable to reach the assistant. Please try again." },
        { status: 502 },
      );
    }

    const data = (await groqResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from assistant." },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
