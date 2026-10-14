"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Building2, Loader2, MapPin, Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  fetchPlaces,
  PLACE_AUTOCOMPLETE_DEBOUNCE_MS,
  PLACE_AUTOCOMPLETE_MAX,
  PLACE_AUTOCOMPLETE_MIN_CHARS,
  type PlaceResult,
} from "@/lib/placeSearch";
import type { Organization } from "@/lib/types";

const MAX_ORG_SUGGESTIONS = 3;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** Already-loaded organizations matching the text (shown first in the suggestions). */
  localMatches?: Organization[];
  onSelectOrganization?: (org: Organization) => void;
  /** Geocode the text as a place (Enter without local matches, or the "Search places" row). */
  onSearchPlace?: (text: string) => void;
  onSelectPlace?: (place: PlaceResult) => void;
  placeSearching?: boolean;
  placeError?: string | null;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  localMatches = [],
  onSelectOrganization,
  onSearchPlace,
  onSelectPlace,
  placeSearching = false,
  placeError = null,
}: SearchBarProps) {
  const { t, language } = useLanguage();
  const hasValue = value.length > 0;
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = value.trim();
  const placeEnabled = Boolean(onSearchPlace);

  // Debounced autocomplete: 400 ms, from 3 characters, at most 5 suggestions.
  useEffect(() => {
    if (!placeEnabled || trimmed.length < PLACE_AUTOCOMPLETE_MIN_CHARS) {
      setPlaces([]);
      setLoadingPlaces(false);
      return;
    }

    const controller = new AbortController();
    setLoadingPlaces(true);
    const timer = setTimeout(async () => {
      const outcome = await fetchPlaces(
        trimmed,
        PLACE_AUTOCOMPLETE_MAX,
        language,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setPlaces(outcome.status === "ok" ? outcome.places : []);
      setLoadingPlaces(false);
    }, PLACE_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, language, placeEnabled]);

  const closeSoon = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const keepOpen = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
    // Enter keeps filtering the loaded list when something matches; otherwise it searches the place.
    if (trimmed && placeEnabled && localMatches.length === 0) {
      setOpen(false);
      onSearchPlace?.(trimmed);
    }
  };

  const showDropdown =
    open &&
    placeEnabled &&
    trimmed.length > 0 &&
    (localMatches.length > 0 || places.length > 0 || trimmed.length >= 2);

  return (
    <form className="relative mb-4" onSubmit={handleSubmit}>
      <label htmlFor="org-search" className="sr-only">
        {t("searchPlaceholder")}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          id="org-search"
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            keepOpen();
            setOpen(true);
          }}
          onBlur={closeSoon}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-brand border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-white/10 dark:bg-surface dark:text-slate-200 dark:placeholder:text-slate-500"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label={t("searchClear")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {placeError && (
        <p
          className="mt-2 text-sm text-amber-700 dark:text-amber-300"
          role="alert"
          data-testid="place-error"
        >
          {placeError}
        </p>
      )}

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          onMouseDown={keepOpen}
          className="absolute left-0 right-0 z-[1100] mt-1 overflow-hidden rounded-brand border border-slate-200 bg-white text-sm shadow-xl dark:border-white/10 dark:bg-surface-card"
        >
          {localMatches.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                {t("placeOrgsHeading")}
              </p>
              {localMatches.slice(0, MAX_ORG_SUGGESTIONS).map((org) => (
                <button
                  key={org.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(org.name);
                    setOpen(false);
                    onSelectOrganization?.(org);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-gray-100 dark:hover:bg-white/5"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0 truncate">
                    {org.name}
                    {org.city ? ` · ${org.city}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(places.length > 0 || loadingPlaces) && (
            <div>
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                {t("placePlacesHeading")}
              </p>
              {places.map((place) => (
                <button
                  key={`${place.lat},${place.lng},${place.name}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  data-testid="place-suggestion"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    onSelectPlace?.(place);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-gray-100 dark:hover:bg-white/5"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
                  <span className="min-w-0 truncate">{place.name}</span>
                </button>
              ))}
              {loadingPlaces && places.length === 0 && (
                <p className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("placeSearching")}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            role="option"
            aria-selected={false}
            data-testid="search-places-row"
            disabled={placeSearching}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              onSearchPlace?.(trimmed);
            }}
            className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-left font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60 dark:border-white/10 dark:text-blue-300 dark:hover:bg-white/5"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">
              {t("placeSearchRow").replace("{text}", trimmed)}
            </span>
          </button>
        </div>
      )}
    </form>
  );
}
