"use client";

import { Car, Footprints, Loader2, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { RouteData, RoutingMode } from "@/lib/routing";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: {
  mode: RoutingMode;
  icon: typeof Car;
  labelKey: "routeDriving" | "routeWalking";
}[] = [
  { mode: "walking", icon: Footprints, labelKey: "routeWalking" },
  { mode: "driving", icon: Car, labelKey: "routeDriving" },
];

interface RouteControlsProps {
  destination: Organization;
  route: RouteData | null;
  routeMode: RoutingMode;
  loading: boolean;
  error: string | null;
  onModeChange: (mode: RoutingMode) => void;
  onClear: () => void;
}

export function RouteControls({
  destination,
  route,
  routeMode,
  loading,
  error,
  onModeChange,
  onClear,
}: RouteControlsProps) {
  const { t } = useLanguage();

  const timeLabel =
    routeMode === "walking" ? t("routeWalkTime") : t("routeDriveTime");

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-gray-700/80 bg-gray-900/95 p-3 shadow-xl backdrop-blur-sm">
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

        <div className="mb-3 flex gap-1 rounded-lg bg-gray-800/80 p-1">
          {MODES.map(({ mode, icon: Icon, labelKey }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onModeChange(mode)}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
                routeMode === mode
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white",
                loading && "opacity-60",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </button>
          ))}
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
          <>
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
                <p className="text-xs text-gray-500">{timeLabel}</p>
              </div>
            </div>

            {route.steps.length > 0 && (
              <ol className="mt-3 max-h-36 space-y-1.5 overflow-y-auto border-t border-gray-700/60 pt-3 text-xs text-gray-300">
                {route.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 font-medium text-blue-400">
                      {i + 1}.
                    </span>
                    <span>{step.instruction}</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}
