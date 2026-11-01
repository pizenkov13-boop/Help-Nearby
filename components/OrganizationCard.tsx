"use client";

import {
  BadgeCheck,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { formatDistance, useDistanceUnit } from "@/lib/distanceUnits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { recordImpactClick } from "@/lib/impact.client";
import { openOrganizationSheet, openRoute } from "@/lib/orgActions";
import { getPhoneTelUrl, getOrganizationOpenStatus } from "@/lib/orgUtils";
import {
  isApproximateLocation,
  isOverpassOrganization,
} from "@/lib/organizationCoordinates";
import { getOrganizationSource } from "@/lib/organizationSource";
import type { Category, Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Makes the title link/button cover the whole card body (an overlay, not a wrapper). */
const STRETCH =
  "after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-blue-500";

const CATEGORY_LABEL_KEY: Record<Category, TranslationKey> = {
  food: "categoryFood",
  shelter: "categoryShelter",
  medical: "categoryMedical",
  clothing: "categoryClothing",
  volunteer: "categoryVolunteer",
};

/** Dark text on a light tint (light theme), light text on a dark tint (dark theme): AA contrast both ways. */
const CATEGORY_CHIP: Record<Category, string> = {
  food: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  shelter: "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200",
  medical: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
  clothing: "bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-200",
  volunteer: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};

const PILL = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[15px] font-semibold leading-snug";

function formatAddedDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

interface OrganizationCardProps {
  org: Organization;
  onSelect?: (org: Organization) => void;
  onImpactRecorded?: () => void;
  selected?: boolean;
  /** Show city, description and an "Added …" line (used on /recent). */
  addedLabel?: string;
}

export function OrganizationCard({
  org,
  onSelect,
  onImpactRecorded,
  selected,
  addedLabel,
}: OrganizationCardProps) {
  const { t, language } = useLanguage();
  const unit = useDistanceUnit();
  const source = getOrganizationSource(org);
  const openStatus = getOrganizationOpenStatus(org);
  const open = openStatus === "open";
  const telUrl = getPhoneTelUrl(org.phone);
  const hasPhone = Boolean(org.phone?.trim());
  // Country-level OCHA entries have no confirmed address, so no directions are offered.
  const approximate = isApproximateLocation(org);
  // Source and date are shown only when the data has them (OSM entries carry no date).
  const osmSource = !source && !org.verified && isOverpassOrganization(org);
  const addedOn = formatAddedDate(org.createdAt, language);

  const handleCallClick = () => {
    recordImpactClick(org.id, "call");
    onImpactRecorded?.();
  };

  const handleDirectionsClick = () => {
    recordImpactClick(org.id, "directions");
    onImpactRecorded?.();
    openRoute(org);
  };

  const handleCardOpen = () => {
    onSelect?.(org);
    openOrganizationSheet(org);
  };

  const actionBase =
    "inline-flex min-h-14 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-[17px] font-bold text-white transition-colors";
  const routeClass = cn(actionBase, "org-btn route bg-blue-700 hover:bg-blue-600 active:bg-blue-800", !hasPhone && "w-full");

  return (
    <article
      className={cn(
        "org-card group w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg hover:shadow-blue-500/5 dark:border-gray-800 dark:bg-gray-800/60 dark:hover:border-gray-700",
        selected && "border-blue-500/50 ring-1 ring-blue-500/30",
        org.verified && "border-blue-500/20",
      )}
    >
      <div className="relative min-w-0 cursor-pointer p-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <span className={cn(PILL, CATEGORY_CHIP[org.category])}>
              <CategoryIcon category={org.category} className="h-4 w-4" />
              <span className="break-words">{t(CATEGORY_LABEL_KEY[org.category])}</span>
            </span>
            {org.distance && (
              <span
                className="shrink-0 org-dist text-xl font-bold leading-tight tabular-nums text-blue-800 dark:text-blue-300"
                data-testid="org-distance"
              >
                {formatDistance(org.distance, unit, language)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug text-slate-900 break-words break-anywhere group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
              <button
                type="button"
                onClick={handleCardOpen}
                className={cn(STRETCH, "text-start")}
              >
                {org.name}
              </button>
            </h3>
            {(org.country || (addedLabel && org.city)) && (
              <p className="org-sub mt-0.5 text-base text-slate-700 break-words break-anywhere dark:text-gray-300">
                {addedLabel
                  ? [org.city, org.country].filter(Boolean).join(", ")
                  : org.country}
              </p>
            )}
          </div>

          {org.address && (
            <p className="org-sub flex min-w-0 items-start gap-2 text-base text-slate-800 dark:text-gray-200">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-500 dark:text-gray-400" aria-hidden />
              <span className="min-w-0 break-words break-anywhere">{org.address}</span>
            </p>
          )}

          {addedLabel && org.description && (
            <p className="line-clamp-3 text-base text-slate-700 dark:text-gray-300">
              {org.description}
            </p>
          )}

          {addedLabel && (
            <p className="flex items-center gap-1.5 text-[15px] text-slate-700 dark:text-gray-300">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              {addedLabel}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {openStatus !== "unknown" && (
              <span
                className={cn(
                  PILL,
                  open
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "bg-slate-200 text-slate-800 dark:bg-gray-700 dark:text-gray-200",
                )}
                data-testid="open-status"
              >
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                {open ? t("openNow") : t("closed")}
              </span>
            )}
            {org.verified && (
              <span
                className={cn(PILL, "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-600/30 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-500/30")}
              >
                <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
                {t("verified")}
              </span>
            )}
            {!org.verified && isOverpassOrganization(org) && (
              <span
                className={cn(PILL, "bg-amber-100 text-amber-900 ring-1 ring-amber-600/30 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30")}
                data-testid="unverified-osm-badge"
              >
                {t("unverifiedOsmBadge")}
              </span>
            )}
            {approximate && (
              <span
                className={cn(PILL, "bg-slate-100 text-slate-800 dark:bg-gray-700/60 dark:text-gray-200")}
                data-testid="list-only-badge"
              >
                {t("listOnlyBadge")}
              </span>
            )}
            {org.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-amber-800 dark:text-amber-300">
                <Star className="h-4 w-4 fill-current" aria-hidden />
                {org.rating.toFixed(1)}
              </span>
            )}
          </div>

          {(source || osmSource || addedOn) && (
            <p className="org-src min-w-0 text-[15px] text-slate-700 dark:text-gray-300">
              {(source || osmSource) && (
                <>
                  <span className="me-1">{t("citySourceLabel")}</span>
                  {source?.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-10 -my-3 inline-block max-w-full truncate py-3 align-middle font-semibold text-blue-800 underline dark:text-blue-300"
                    >
                      {source.label}
                    </a>
                  ) : (
                    <span className="font-semibold">{source?.label ?? "OpenStreetMap"}</span>
                  )}
                </>
              )}
              {addedOn && (
                <span>
                  {source || osmSource ? " · " : ""}
                  {t("recentAdded").replace("{date}", addedOn)}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {(hasPhone || !approximate) && (
        <div className="org-actions flex flex-col gap-2 border-t border-slate-200 px-4 pb-4 pt-3 dark:border-gray-700/50 sm:flex-row">
          {hasPhone && (
            <a
              href={telUrl}
              onClick={handleCallClick}
              className={cn(actionBase, "org-btn call bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800")}
              aria-label={`${t("callNow")}: ${org.phone}`}
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              {t("callNow")}
            </a>
          )}
          {!approximate && (
            <button type="button" onClick={handleDirectionsClick} className={routeClass}>
              <Navigation className="h-5 w-5 shrink-0" aria-hidden />
              {t("getDirections")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
