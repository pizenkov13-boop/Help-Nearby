"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { ChatMessageText } from "@/components/ChatMessageText";
import { getChatContext } from "@/lib/chatClientContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function ChatWidget() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t("chatWelcome"),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Phones: the panel is full-screen and follows the visual viewport (keyboard-aware).
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const phone = window.matchMedia("(max-width: 639px)");
    const update = () => {
      setViewport(vv && phone.matches ? { height: vv.height, top: vv.offsetTop } : null);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    phone.addEventListener("change", update);

    const previousOverflow = document.body.style.overflow;
    if (phone.matches) document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      phone.removeEventListener("change", update);
      document.body.style.overflow = previousOverflow;
      setViewport(null);
    };
  }, [open]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome" ? { ...m, text: t("chatWelcome") } : m,
      ),
    );
  }, [t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.text }));

    const apiMessages = [...history, { role: "user" as const, content: text }];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          language,
          context: getChatContext(),
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? t("chatError"));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.message ?? t("chatError"),
        },
      ]);
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : t("chatError");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: errorText,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, language, messages, t]);

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex h-[min(480px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-500/10 animate-fade-in dark:border-gray-700 dark:bg-gray-900 sm:right-6 max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-0 max-sm:h-dvh max-sm:w-full max-sm:rounded-none max-sm:border-0"
          style={
            viewport
              ? { height: viewport.height, top: viewport.top, bottom: "auto" }
              : undefined
          }
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600/10 to-teal-500/10 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-gray-800 dark:from-blue-600/20 dark:to-emerald-600/20">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-900 dark:text-white">{t("chatTitle")}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white max-sm:-mr-2"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[88%] rounded-xl px-3 py-2 text-[15px] leading-snug sm:max-w-[85%] sm:text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-gray-800 dark:text-gray-200",
                )}
              >
                {msg.role === "assistant" ? (
                  <ChatMessageText text={msg.text} />
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[85%] items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-gray-800 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600 dark:text-emerald-400" />
                <span>{t("chatTyping")}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={t("chatPlaceholder")}
                maxLength={1000}
                disabled={isLoading}
                className="min-h-11 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 sm:text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t("chatSend")}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-gray-500">
              {t("chatDisclaimer")}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg transition-all hover:scale-110 animate-pulse-soft sm:bottom-6 sm:right-6",
          // On phones the open chat is full-screen and has its own close button.
          open && "scale-95 max-sm:hidden",
        )}
        aria-label={t("chatTitle")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6 animate-float" />
        )}
      </button>
    </>
  );
}
