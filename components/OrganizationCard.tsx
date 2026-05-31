"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CATEGORY_CONFIG } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  trackCallOrganization,
  trackGetDirections,
} from "@/lib/analytics.client";
import { recordImpactClick } from "@/lib/impact.client";
import {
  getDirectionsUrl,
  getPhoneTelUrl,
  isOrganizationOpen,
} from "@/lib/orgUtils";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  org: Organization;
  onSelect?: (org: Organization) => void;
  onGetDirections?: (org: Organization) => void;
  onImpactRecorded?: () => void;
  selected?: boolean;
}

export function OrganizationCard({
  org,
  onSelect,
  onGetDirections,
  onImpactRecorded,
  selected,
}: OrganizationCardProps) {
  const { t } = useLanguage();
  const cfg = CATEGORY_CONFIG[org.category];
  const open = isOrganizationOpen(org);
  const directionsUrl = getDirectionsUrl(org);
  const telUrl = getPhoneTelUrl(org.phone);
  const hasPhone = Boolean(org.phone?.trim());

  const handleCallClick = () => {
    trackCallOrganization(org);
    recordImpactClick(org.id, "call");
    onImpactRecorded?.();
  };

  const handleDirectionsClick = () => {
    trackGetDirections(org);
    recordImpactClick(org.id, "directions");
    onImpactRecorded?.();
    onGetDirections?.(org);
  };

  const metaBlock = (
    <>
      {org.distance && (
        <span className="text-sm font-medium text-blue-400">{org.distance}</span>
      )}
      {org.rating > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <Star className="h-4 w-4 fill-amber-400" />
          <span className="text-sm font-medium">{org.rating.toFixed(1)}</span>
        </div>
      )}
    </>
  );

  const badgesBlock = (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          cfg.bg,
          cfg.color,
        )}
      >
        <CategoryIcon category={org.category} />
        <span className="break-words">{org.category}</span>
      </span>
      {org.verified && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
          <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
          {t("verified")}
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
          <Clock className="h-3 w-3 shrink-0" />
          {open ? t("openNow") : t("closed")}
        </span>
      )}
    </div>
  );

  const cardBody = (
    <div className="flex min-w-0 flex-col gap-2.5 md:gap-3">
      <div className="order-4 md:order-1">{badgesBlock}</div>

      <div className="order-1 min-w-0 md:order-2 md:flex md:items-start md:justify-between md:gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-white break-words break-anywhere md:truncate md:text-lg group-hover:text-blue-300">
            {org.name}
          </h3>
          {org.country && (
            <p className="mt-0.5 text-sm text-gray-500 break-words break-anywhere">
              {org.country}
            </p>
          )}
        </div>
        {(org.distance || org.rating > 0) && (
          <div className="hidden shrink-0 flex-col items-end gap-1 md:flex">
            {metaBlock}
          </div>
        )}
      </div>

      {org.address && (
        <p className="order-2 flex min-w-0 items-start gap-2 text-sm text-gray-400 md:order-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          <span className="min-w-0 break-words break-anywhere">{org.address}</span>
        </p>
      )}

      {(org.distance || org.rating > 0) && (
        <div className="order-3 flex flex-wrap items-center gap-3 md:hidden">
          {metaBlock}
        </div>
      )}
    </div>
  );

  return (
    <article
      className={cn(
        "group w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-800/60 transition-all hover:border-gray-700 hover:bg-gray-800 hover:shadow-lg hover:shadow-blue-500/5",
        selected && "border-blue-500/50 ring-1 ring-blue-500/30",
        org.verified && "border-blue-500/20",
      )}
    >
      {org.verified ? (
        <Link
          href={`/org/${org.slug}`}
          onClick={() => onSelect?.(org)}
          className="block cursor-pointer p-3 md:p-4"
        >
          {cardBody}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => onSelect?.(org)}
          className="block w-full min-w-0 cursor-pointer p-3 text-left md:p-4"
        >
          {cardBody}
        </button>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-700/50 px-3 pb-3 pt-2.5 md:flex-row md:px-4 md:pb-4 md:pt-3">
        {hasPhone && (
          <a
            href={telUrl}
            onClick={handleCallClick}
            className="group/call relative inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:bg-emerald-700"
            aria-label={`${t("callNow")}: ${org.phone}`}
          >
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-gray-950 px-3 py-1.5 text-xs font-medium text-emerald-300 opacity-0 shadow-xl transition-opacity group-hover/call:opacity-100 md:block"
            >
              {org.phone}
            </span>
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            {t("callNow")}
          </a>
        )}
        {onGetDirections ? (
          <button
            type="button"
            onClick={handleDirectionsClick}
            className={cn(
              "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-emerald-500",
              !hasPhone && "w-full",
            )}
          >
            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
            {t("getDirections")}
          </button>
        ) : (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackGetDirections(org);
              recordImpactClick(org.id, "directions");
              onImpactRecorded?.();
            }}
            className={cn(
              "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-emerald-500",
              !hasPhone && "w-full",
            )}
          >
            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
            {t("getDirections")}
          </a>
        )}
      </div>
    </article>
  );
}
