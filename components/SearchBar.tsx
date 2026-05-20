"use client";

import { Search, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useLanguage();
  const hasValue = value.length > 0;

  return (
    <div className="mb-4">
      <label htmlFor="org-search" className="sr-only">
        {t("searchPlaceholder")}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          id="org-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-10 text-sm text-gray-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoComplete="off"
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            aria-label={t("searchClear")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
