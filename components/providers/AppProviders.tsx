"use client";

import type { LanguageCode } from "@/lib/types";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AutoTheme } from "@/components/AutoTheme";
import { FormsAvailabilityProvider } from "@/components/providers/FormsAvailability";

export function AppProviders({
  children,
  initialLanguage,
  formsEnabled = true,
  sunnyCountry = false,
}: {
  children: React.ReactNode;
  initialLanguage?: LanguageCode;
  formsEnabled?: boolean;
  sunnyCountry?: boolean;
}) {
  return (
    <>
      <AutoTheme sunnyCountry={sunnyCountry} />
      <FormsAvailabilityProvider enabled={formsEnabled}>
        <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
      </FormsAvailabilityProvider>
    </>
  );
}
