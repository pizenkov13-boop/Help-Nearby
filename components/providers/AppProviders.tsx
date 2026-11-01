"use client";

import type { LanguageCode } from "@/lib/types";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { ThemeRegionSync } from "@/components/ThemeRegionSync";

export function AppProviders({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
}) {
  return (
    <ThemeProvider>
      <ThemeColorMeta />
      <ThemeRegionSync />
      <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
