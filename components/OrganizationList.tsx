"use client";

import { Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Organization } from "@/lib/types";
import { OrganizationCard } from "./OrganizationCard";

interface OrganizationListProps {
  organizations: Organization[];
  selectedId?: string;
  onSelect: (org: Organization) => void;
  onGetDirections?: (org: Organization) => void;
}

export function OrganizationList({
  organizations,
  selectedId,
  onSelect,
  onGetDirections,
}: OrganizationListProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-400">
        <span className="font-semibold text-white">{organizations.length}</span>{" "}
        {t("resultsCount")}
      </p>

      {organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-800/30 px-6 py-16 text-center">
          <Building2 className="mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">{t("noResults")}</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
