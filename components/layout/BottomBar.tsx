"use client";

import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Search, Siren } from "lucide-react";
import type { ReactNode } from "react";
import { openEmergencyHelp } from "@/lib/emergencyEvents";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";
import {
  CHAT_OPEN_EVENT,
  FIND_HELP_EVENT,
  dispatchUiEvent,
} from "@/lib/uiEvents";
import { cn } from "@/lib/utils";

function Item({
  icon,
  label,
  ariaLabel,
  className,
  active,
  current,
  ...rest
}: {
  icon: ReactNode;
  label: string;
  ariaLabel?: string;
  className?: string;
  active?: boolean;
  current?: boolean;
  onClick: () => void;
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn("bb-item", active && "on", className)}
      aria-label={ariaLabel}
      aria-current={current ? "page" : undefined}
      {...rest}
    >
      <span className="bb-pill" aria-hidden>
        {icon}
      </span>
      <span className="bb-label">{label}</span>
    </button>
  );
}

/**
 * Phones only: three equal items (find help, urgent, chat); the language switcher lives in the header. The page reserves
 * room for the bar (.has-bottom-bar in globals.css), so it never covers content.
 */
export function BottomBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const onFind = () => {
    if (pathname === "/") dispatchUiEvent(FIND_HELP_EVENT);
    else router.push("/?find=1");
  };

  return (
    <nav className="bottom-bar" aria-label={t("navFind")}>
      <Item icon={<Search />} label={t("navFind")} active={pathname === "/"}
        current={pathname === "/"}
        onClick={onFind} />
      <Item
        icon={<Siren />}
        label={t("navUrgent")}
        ariaLabel={t("emergencyHelp")}
        className="bb-emergency"
        onClick={openEmergencyHelp}
      />
      {siteConfig.chatEnabled ? (
        <Item
          icon={<MessageCircle />}
          label={t("navChat")}
          ariaLabel={t("chatTitle")}
          onClick={() => dispatchUiEvent(CHAT_OPEN_EVENT)}
        />
      ) : null}
    </nav>
  );
}
