"use client";

import Link from "next/link";
import {
  Clock,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { CATEGORY_CONFIG } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  getDirectionsUrl,
  getPhoneTelUrl,
  isOrganizationOpen,
} from "@/lib/org";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  org: Organization;
  onSelect?: (org: Organization) => void;
  onGetDirections?: (org: Organization) => void;
  selected?: boolean;
}

export function OrganizationCard({
  org,
  onSelect,
  onGetDirections,
  selected,
}: OrganizationCardProps) {
  const { t } = useLanguage();
  const cfg = CATEGORY_CONFIG[org.category];
  const open = isOrganizationOpen(org);
  const directionsUrl = getDirectionsUrl(org);
  const telUrl = getPhoneTelUrl(org.phone);
  const hasPhone = Boolean(org.phone?.trim());

  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                cfg.bg,
                cfg.color,
              )}
            >
              {cfg.icon} {org.category}
            </span>
            {org.verified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                ✓ {t("verified")}
              </span>
            )}
            {org.verified && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  open
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-gray-700 text-gray-400",
                )}
              >
                <Clock className="h-3 w-3" />
                {open ? t("openNow") : t("closed")}
              </span>
            )}
          </div>
          <h3 className="truncate text-lg font-semibold text-white group-hover:text-blue-300">
            {org.name}
          </h3>
          {org.country && (
            <p className="mt-0.5 text-sm text-gray-500">{org.country}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {org.distance && (
            <span className="text-sm font-medium text-blue-400">
              {org.distance}
            </span>
          )}
          {org.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="text-sm font-medium">{org.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {org.address && (
        <p className="mt-3 flex items-start gap-2 text-sm text-gray-400">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <span>{org.address}</span>
        </p>
      )}
    </>
  );

  return (
    <article
      className={cn(
        "group rounded-xl border border-gray-800 bg-gray-800/60 transition-all hover:border-gray-700 hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/5",
        selected && "border-blue-500/50 ring-1 ring-blue-500/30",
        org.verified && "border-blue-500/20",
      )}
    >
      {org.verified ? (
        <Link
          href={`/org/${org.slug}`}
          onClick={() => onSelect?.(org)}
          className="block cursor-pointer p-4"
        >
          {cardBody}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onSelect?.(org)}
          className="block w-full cursor-pointer p-4 text-left"
        >
          {cardBody}
        </button>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-700/50 px-4 pb-4 pt-3 sm:flex-row">
        {hasPhone && (
          <a
            href={telUrl}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-emerald-400 hover:to-emerald-500"
          >
            <Phone className="h-4 w-4" />
            {t("callNow")}
          </a>
        )}
        {onGetDirections ? (
          <button
            type="button"
            onClick={() => onGetDirections(org)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-emerald-500",
              !hasPhone && "w-full",
            )}
          >
            <Navigation className="h-4 w-4" />
            {t("getDirections")}
          </button>
        ) : (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-emerald-500",
              !hasPhone && "w-full",
            )}
          >
            <Navigation className="h-4 w-4" />
            {t("getDirections")}
          </a>
        )}
      </div>
    </article>
  );
}
