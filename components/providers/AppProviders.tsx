"use client";

import type { LanguageCode } from "@/lib/types";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { ThemeRegionSync } from "@/components/ThemeRegionSync";
import { FormsAvailabilityProvider } from "@/components/providers/FormsAvailability";

export function AppProviders({
  children,
  initialLanguage,
  formsEnabled = true,
}: {
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
  formsEnabled?: boolean;
}) {
  return (
    <ThemeProvider>
      <ThemeColorMeta />
      <ThemeRegionSync />
      <FormsAvailabilityProvider enabled={formsEnabled}>
        <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
      </FormsAvailabilityProvider>
    </ThemeProvider>
  );
}
