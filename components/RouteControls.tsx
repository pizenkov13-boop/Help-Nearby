"use client";

import { Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface RouteControlsProps {
  loading: boolean;
  onClear: () => void;
}

export function RouteControls({ loading, onClear }: RouteControlsProps) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClear}
      disabled={loading}
      className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-gray-600/80 bg-gray-900/95 text-gray-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-60"
      aria-label={t("routeClear")}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
      ) : (
        <X className="h-5 w-5" />
      )}
    </button>
  );
}
