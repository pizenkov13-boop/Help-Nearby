"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe, MessageCircle, Search, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import { openEmergencyHelp } from "@/lib/emergencyEvents";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";
import {
  CHAT_OPEN_EVENT,
  FIND_HELP_EVENT,
  LANGUAGE_STATE_EVENT,
  LANGUAGE_TOGGLE_EVENT,
  dispatchUiEvent,
} from "@/lib/uiEvents";
import { cn } from "@/lib/utils";

/**
 * Phones only: the three things a person in a hurry needs (find help, emergency, language) plus the
 * chat, in the thumb zone. The page reserves room for it (see .has-bottom-bar in globals.css), so it
 * never covers content.
 */
export function BottomBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const onState = (e: Event) => setLangOpen(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener(LANGUAGE_STATE_EVENT, onState);
    return () => window.removeEventListener(LANGUAGE_STATE_EVENT, onState);
  }, []);

  const onFind = () => {
    if (pathname === "/") dispatchUiEvent(FIND_HELP_EVENT);
    else router.push("/?find=1");
  };

  return (
    <nav className="bottom-bar" aria-label={t("navFind")}>
      <button type="button" className="bb-item bb-find" onClick={onFind}>
        <Search aria-hidden />
        <span>{t("navFind")}</span>
      </button>
      <button type="button" className="bb-item bb-emergency" onClick={openEmergencyHelp}>
        <Siren aria-hidden />
        <span>{t("emergencyHelp")}</span>
      </button>
      <button
        type="button"
        className={cn("bb-item", langOpen && "on")}
        aria-label={t("languageMenu")}
        aria-haspopup="menu"
        aria-expanded={langOpen}
        onClick={() => dispatchUiEvent(LANGUAGE_TOGGLE_EVENT)}
      >
        <Globe aria-hidden />
        <span>{t("languageMenu")}</span>
      </button>
      {siteConfig.chatEnabled ? (
        <button
          type="button"
          className="bb-item bb-chat"
          aria-label={t("chatTitle")}
          onClick={() => dispatchUiEvent(CHAT_OPEN_EVENT)}
        >
          <MessageCircle aria-hidden />
          <span>{t("navChat")}</span>
        </button>
      ) : null}
    </nav>
  );
}
