"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useFeatures } from "@/lib/useFeatures";

/** Shows its form only to visitors who may submit; the others get one neutral line. */
export function FormsGate({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { forms } = useFeatures();

  if (forms === null) return null;
  if (!forms) {
    return (
      <p className="py-6 text-center text-slate-600 dark:text-gray-400" role="status" data-testid="forms-unavailable">
        {t("formsUnavailable")}
      </p>
    );
  }
  return <>{children}</>;
}
