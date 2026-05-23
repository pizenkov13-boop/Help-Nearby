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

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">{organizations.length}</span>{" "}
        {t("resultsCount")}
      </p>

      {isLoading && organizations.length === 0 ? (
        <OrganizationListSkeleton count={4} />
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-800/30 px-6 py-16 text-center">
          <Building2 className="mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">
            {hasSearch
              ? formatSearchNoResults(language, trimmedSearch)
              : (emptyMessage ?? t("noResults"))}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
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
