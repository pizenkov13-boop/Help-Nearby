"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeColorMeta />
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
