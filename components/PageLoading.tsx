"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/** Full-page loading fallback in the visitor's language. */
export function PageLoading({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <div
      className={className ?? "flex min-h-screen items-center justify-center bg-surface text-slate-500"}
      role="status"
    >
      {t("pageLoading")}
    </div>
  );
}
