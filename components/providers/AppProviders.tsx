"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { ThemeRegionSync } from "@/components/ThemeRegionSync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeColorMeta />
      <ThemeRegionSync />
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
