"use client";

import { Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatSearchNoResults } from "@/lib/i18n/translations";
import type { Organization } from "@/lib/types";
import { OrganizationCard } from "./OrganizationCard";
import { OrganizationListSkeleton } from "./OrganizationCardSkeleton";

interface OrganizationListProps {
  organizations: Organization[];
  searchQuery?: string;
  /** Shown when the list is empty and no search query is active. */
  emptyMessage?: string;
  selectedId?: string;
  onSelect: (org: Organization) => void;
  onGetDirections?: (org: Organization) => void;
  onImpactRecorded?: () => void;
  isLoading?: boolean;
}

export function OrganizationList({
  organizations,
  searchQuery = "",
  emptyMessage,
  selectedId,
  onSelect,
  onGetDirections,
  onImpactRecorded,
  isLoading = false,
}: OrganizationListProps) {
  const { t, language } = useLanguage();
  const trimmedSearch = searchQuery.trim();
  const hasSearch = trimmedSearch.length > 0;

  const showSkeleton = isLoading && organizations.length === 0;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 md:gap-4">
      {!showSkeleton && (
        <p className="text-sm text-slate-600 dark:text-gray-400">
          <span className="font-semibold text-slate-900 dark:text-white">{organizations.length}</span>{" "}
          {t("resultsCount")}
        </p>
      )}

      {showSkeleton ? (
        <OrganizationListSkeleton count={4} />
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center dark:border-gray-700 dark:bg-gray-800/30 md:px-6">
          <Building2 className="mb-3 h-12 w-12 text-slate-400 dark:text-gray-600" />
          <p className="break-words text-slate-600 dark:text-gray-400">
            {hasSearch
              ? formatSearchNoResults(language, trimmedSearch)
              : (emptyMessage ?? t("noResults"))}
          </p>
        </div>
      ) : (
        <div className="grid w-full min-w-0 max-w-full gap-3 md:gap-4">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              selected={selectedId === org.id}
              onSelect={onSelect}
              onGetDirections={onGetDirections}
              onImpactRecorded={onImpactRecorded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
