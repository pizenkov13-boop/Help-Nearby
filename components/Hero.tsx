"use client";

import { Loader2, MapPin, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface HeroProps {
  onFindHelp: () => void;
  isLocating: boolean;
}

export function Hero({ onFindHelp, isLocating }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gray-50 px-4 py-16 transition-colors duration-300 dark:bg-gray-900 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="animate-fade-in mb-4 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-4 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{t("brand")}</span>
        </div>

        <h1 className="animate-fade-in-up text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-gradient-hero">{t("heroTitle")}</span>
        </h1>

        <p className="animate-fade-in-delay-1 mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
          {t("heroSubtitle")}
        </p>

        <div className="animate-fade-in-delay-2 mt-10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={onFindHelp}
            disabled={isLocating}
            className={cn(
              "group inline-flex items-center gap-2 rounded-xl bg-gradient-cta px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-wait disabled:opacity-80 disabled:hover:scale-100",
            )}
          >
            {isLocating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5 transition-transform group-hover:scale-110" />
            )}
            {isLocating ? t("locating") : t("heroCta")}
          </button>
        </div>
      </div>
    </section>
  );
}