"use client";

import { MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface PlaceBarProps {
  /** City / district the results are around, or a generic "your current location". */
  label: string;
  /** Reported accuracy in km when the position is only approximate (otherwise null). */
  approximateKm: number | null;
}

/** Shows the place the current results are for. */
export function PlaceBar({
  label,
  approximateKm,
}: PlaceBarProps) {
  const { t } = useLanguage();

  return (
    <div
      className="mb-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-800 md:text-xs dark:text-blue-200"
      data-testid="place-chip"
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="break-words font-medium leading-snug" data-testid="place-label">
            {t("resultsNearLabel").replace("{place}", label)}
          </span>
        </div>
      </div>

      {approximateKm !== null && (
        <p className="mt-1 text-amber-800 dark:text-amber-200" role="note" data-testid="place-approx">
          {t("placeApproxNotice").replace("{km}", String(approximateKm))}
        </p>
      )}

    </div>
  );
}
