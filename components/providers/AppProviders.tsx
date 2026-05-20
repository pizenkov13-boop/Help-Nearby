"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
