"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "./ThemeProvider";
import { PostHogProvider } from "./PostHogProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
}
