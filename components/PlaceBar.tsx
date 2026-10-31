"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface PlaceBarProps {
  /** City / district the results are around, or a generic "your current location". */
  label: string;
  /** Reported accuracy in km when the position is only approximate (otherwise null). */
  approximateKm: number | null;
  onSearchPlace: (text: string) => void;
  onUseMyLocation: () => void;
  placeSearching: boolean;
  placeError: string | null;
  isLocating: boolean;
}

/** Always says which place the results are for, and lets the person change it. */
export function PlaceBar({
  label,
  approximateKm,
  onSearchPlace,
  onUseMyLocation,
  placeSearching,
  placeError,
  isLocating,
}: PlaceBarProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  // A new place was chosen: fold the form away.
  useEffect(() => {
    setOpen(false);
    setText("");
  }, [label]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim()) onSearchPlace(text);
  };

  return (
    <div
      className="mb-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-800 md:text-xs dark:text-blue-200"
      data-testid="place-chip"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 break-words font-medium" data-testid="place-label">
          {t("resultsNearLabel").replace("{place}", label)}
        </span>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          data-testid="change-place"
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          {t("changePlace")}
        </button>
      </div>

      {approximateKm !== null && (
        <p className="mt-1 text-amber-800 dark:text-amber-200" role="note" data-testid="place-approx">
          {t("placeApproxNotice").replace("{km}", String(approximateKm))}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-2" data-testid="change-place-form">
          <label className="sr-only" htmlFor="place-input">
            {t("placeInputLabel")}
          </label>
          <div className="flex gap-2">
            <input
              id="place-input"
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("placeInputLabel")}
              autoComplete="off"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-white/20 dark:bg-white/5 dark:text-white md:min-h-9 md:text-xs"
            />
            <button
              type="submit"
              disabled={placeSearching || !text.trim()}
              className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50 md:min-h-9 md:text-xs"
            >
              {t("placeSubmit")}
            </button>
          </div>
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={isLocating}
            className="self-start font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
          >
            {t("placeUseMyLocation")}
          </button>
          {placeError && (
            <p className="text-red-700 dark:text-red-300" role="alert">
              {placeError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
