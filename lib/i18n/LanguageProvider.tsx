"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LanguageCode } from "@/lib/types";
import { translations, type TranslationKey } from "./translations";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    [language],
  );

  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";

  const value = useMemo(
    () => ({ language, setLanguage, t, dir }),
    [language, t, dir],
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
