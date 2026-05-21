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
import { LANGUAGES, translations, type TranslationKey } from "./translations";

const STORAGE_KEY = "hn-language";

function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLanguageCode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

function applyDocumentLanguage(code: LanguageCode) {
  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = readStoredLanguage();
    setLanguageState(stored);
    applyDocumentLanguage(stored);
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
    applyDocumentLanguage(code);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    [language],
  );

  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";

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
