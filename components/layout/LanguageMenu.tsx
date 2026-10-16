"use client";

import { Check, ChevronDown, Globe, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LANGUAGES,
  LANGUAGE_NATIVE_NAMES,
} from "@/lib/i18n/translations";
import type { LanguageCode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LanguageMenuProps {
  language: LanguageCode;
  /** Accessible name of the trigger and of the list, e.g. "Language". */
  label: string;
  closeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: LanguageCode) => void;
}

/** Same breakpoint as the mobile header (see globals.css). */
const MOBILE_QUERY = "(max-width: 768px)";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

/**
 * Language switcher: a header-style button that opens a popover on desktop and a bottom
 * sheet on phones. Closes on outside click, Esc and selection; arrow keys move between items.
 */
export function LanguageMenu({
  language,
  label,
  closeLabel,
  open,
  onOpenChange,
  onSelect,
}: LanguageMenuProps) {
  const mobile = useIsMobile();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const close = useCallback(
    (returnFocus = false) => {
      onOpenChange(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [onOpenChange],
  );

  // Outside click / tap.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target) || listRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onOpenChange]);

  // Esc closes from anywhere while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Focus the active item on open; lock page scroll behind the mobile sheet.
  useEffect(() => {
    if (!open) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    const active = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    (active ?? items?.[0])?.focus();

    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, mobile]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Tab") {
      close();
      return;
    }
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
    }
  };

  const items = LANGUAGES.map(({ code, label: short }) => {
    const active = code === language;
    return (
      <button
        key={code}
        type="button"
        role="menuitem"
        lang={code}
        aria-current={active ? "true" : undefined}
        className={cn("lang-item", active && "on")}
        onClick={() => {
          onSelect(code);
          close(true);
        }}
      >
        <span className="lang-item-name">{LANGUAGE_NATIVE_NAMES[code]}</span>
        <span className="lang-item-code" aria-hidden>
          {short}
        </span>
        {active && <Check className="lang-item-check" aria-hidden />}
      </button>
    );
  });

  const currentShort = LANGUAGES.find((l) => l.code === language)?.label ?? "EN";

  return (
    <div className={cn("lang-wrap", open && "open")} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="lang-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => onOpenChange(!open)}
      >
        <Globe className="globe" aria-hidden />
        <span className="current">{currentShort}</span>
        <ChevronDown className="chev" aria-hidden />
      </button>

      {open && !mobile && (
        <div
          id={listId}
          ref={listRef}
          role="menu"
          aria-label={label}
          className="lang-menu"
          onKeyDown={onListKeyDown}
        >
          {items}
        </div>
      )}

      {open &&
        mobile &&
        mounted &&
        createPortal(
          <div className="lang-layer">
            <div className="lang-backdrop" aria-hidden />
            <div
              id={listId}
              ref={listRef}
              role="menu"
              aria-label={label}
              className="lang-sheet"
              onKeyDown={onListKeyDown}
            >
              <div className="lang-sheet-head">
                <span className="lang-sheet-title">{label}</span>
                <button
                  type="button"
                  className="lang-sheet-close"
                  aria-label={closeLabel}
                  onClick={() => close(true)}
                >
                  <X aria-hidden />
                </button>
              </div>
              {items}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
