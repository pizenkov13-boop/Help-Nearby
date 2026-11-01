"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LanguageCode } from "@/lib/types";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguageCode,
  languageDirection,
  pickSupportedLanguage,
} from "./detectLanguage";
import { translations, type TranslationKey } from "./translations";

function readStoredLanguage(): LanguageCode | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguageCode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function applyDocumentLanguage(code: LanguageCode) {
  document.documentElement.lang = code;
  document.documentElement.dir = languageDirection(code);
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * initialLanguage comes from the server (the browser's Accept-Language), so the first paint is already
 * in the right language and direction. A language picked by hand (localStorage) always wins; without
 * one, navigator.languages is checked in case the server could not see the header.
 */
export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}) {
  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);

  useEffect(() => {
    const target =
      readStoredLanguage() ??
      pickSupportedLanguage(
        navigator.languages?.length ? navigator.languages : [navigator.language],
      ) ??
      initialLanguage;
    setLanguageState(target);
    applyDocumentLanguage(target);
    // Reveal the page once React has painted the chosen language (see public/lang-init.js).
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => document.documentElement.classList.remove("lang-pending")),
    );
    return () => cancelAnimationFrame(frame);
  }, [initialLanguage]);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    applyDocumentLanguage(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    [language],
  );

  const dir = languageDirection(language);

  const value = useMemo(
    () => ({ language, setLanguage, t, dir }),
    [language, setLanguage, t, dir],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
