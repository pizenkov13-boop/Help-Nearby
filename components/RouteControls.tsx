"use client";

import { Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { RouteData } from "@/lib/routing";
import type { Organization } from "@/lib/types";

interface RouteControlsProps {
  destination: Organization;
  route: RouteData | null;
  loading: boolean;
  error: string | null;
  onClear: () => void;
}

export function RouteControls({
  destination,
  route,
  loading,
  error,
  onClear,
}: RouteControlsProps) {
  const { t } = useLanguage();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-sm rounded-xl border border-gray-700/80 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-400">
              {t("routeTo")}
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {destination.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            aria-label={t("routeClear")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            {t("routeLoading")}
          </div>
        )}

        {error && !loading && (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {route && !loading && !error && (
          <div className="flex items-center justify-center gap-4 border-t border-gray-700/60 pt-3 text-center">
            <div>
              <p className="text-lg font-bold text-blue-400">
                {route.distanceKm} km
              </p>
              <p className="text-xs text-gray-500">{t("routeDistance")}</p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div>
              <p className="text-lg font-bold text-blue-400">
                {route.durationMinutes} min
              </p>
              <p className="text-xs text-gray-500">{t("routeWalkTime")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
