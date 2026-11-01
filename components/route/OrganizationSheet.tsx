"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Clock, MapPin, Navigation, Phone, X } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { formatDistance, useDistanceUnit } from "@/lib/distanceUnits";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";
import { recordImpactClick } from "@/lib/impact.client";
import { ORG_SHEET_OPEN_EVENT, SHEET_CLOSE_EVENT, openRoute } from "@/lib/orgActions";
import { getOrganizationOpenStatus, getPhoneTelUrl } from "@/lib/orgUtils";
import { isApproximateLocation, isOverpassOrganization } from "@/lib/organizationCoordinates";
import { getOrganizationSource } from "@/lib/organizationSource";
import type { Category, Organization } from "@/lib/types";

const CATEGORY_LABEL_KEY: Record<Category, TranslationKey> = {
  food: "categoryFood",
  shelter: "categoryShelter",
  medical: "categoryMedical",
  clothing: "categoryClothing",
  volunteer: "categoryVolunteer",
};

function formatAddedDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

/**
 * One organization sheet for every list (results, Urgent, recent): name, category, address, distance,
 * open or closed, source; Call only when there is a phone; Route always, and it stays on our site.
 */
export function OrganizationSheet() {
  const { t, language } = useLanguage();
  const unit = useDistanceUnit();
  const [org, setOrg] = useState<Organization | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOrg(null), []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const next = (event as CustomEvent<Organization>).detail;
      if (next) setOrg(next);
    };
    window.addEventListener(ORG_SHEET_OPEN_EVENT, onOpen);
    window.addEventListener(SHEET_CLOSE_EVENT, close);
    return () => {
      window.removeEventListener(ORG_SHEET_OPEN_EVENT, onOpen);
      window.removeEventListener(SHEET_CLOSE_EVENT, close);
    };
  }, [close]);

  useEffect(() => {
    if (!org) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [org, close]);

  if (!org) return null;

  const hasPhone = Boolean(org.phone?.trim());
  // Country-level entries have no real address, so there is nothing to route to.
  const canRoute = !isApproximateLocation(org);
  const openStatus = getOrganizationOpenStatus(org);
  const open = openStatus === "open";
  const source = getOrganizationSource(org);
  const osmSource = !source && !org.verified && isOverpassOrganization(org);
  const addedOn = formatAddedDate(org.createdAt, language);
  const place = [org.address, org.city, org.country].filter(Boolean).join(", ");

  return (
    <div className="os-layer" data-testid="org-sheet">
      <button type="button" className="os-backdrop" aria-label={t("orgSheetClose")} onClick={close} tabIndex={-1} />
      <section className="os-sheet" role="dialog" aria-modal="true" aria-label={org.name}>
        <div className="os-grip" aria-hidden />
        <div className="os-head">
          <span className="os-cat">
            <CategoryIcon category={org.category} className="h-4 w-4" />
            {t(CATEGORY_LABEL_KEY[org.category])}
          </span>
          <button ref={closeRef} type="button" className="os-close" aria-label={t("orgSheetClose")} onClick={close}>
            <X aria-hidden />
          </button>
        </div>

        <h2 className="os-name">{org.name}</h2>

        {org.distance && (
          <p className="os-dist" data-testid="sheet-distance">
            {formatDistance(org.distance, unit, language)}
          </p>
        )}
        {place && (
          <p className="os-line">
            <MapPin aria-hidden />
            <span>{place}</span>
          </p>
        )}

        <div className="os-badges">
          {openStatus !== "unknown" && (
            <span className={open ? "os-badge ok" : "os-badge muted"} data-testid="sheet-open-status">
              <Clock aria-hidden />
              {open ? t("openNow") : t("closed")}
            </span>
          )}
          {org.verified && (
            <span className="os-badge ok">
              <BadgeCheck aria-hidden />
              {t("verified")}
            </span>
          )}
          {!org.verified && isOverpassOrganization(org) && (
            <span className="os-badge warn">{t("unverifiedOsmBadge")}</span>
          )}
        </div>

        {(source || osmSource || addedOn) && (
          <p className="os-src">
            {(source || osmSource) && (
              <>
                <span>{t("citySourceLabel")} </span>
                <strong>{source?.label ?? "OpenStreetMap"}</strong>
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

        <div className={hasPhone && canRoute ? "os-actions" : "os-actions one"}>
          {hasPhone && (
            <a
              href={getPhoneTelUrl(org.phone)}
              className="os-btn call"
              onClick={() => recordImpactClick(org.id, "call")}
              aria-label={`${t("callNow")}: ${org.phone}`}
            >
              <Phone aria-hidden />
              {t("callNow")}
            </a>
          )}
          {canRoute && (
            <button
              type="button"
              className="os-btn route"
              onClick={() => {
                recordImpactClick(org.id, "directions");
                openRoute(org);
              }}
            >
              <Navigation aria-hidden />
              {t("getDirections")}
            </button>
          )}
        </div>

        {org.verified && org.slug && (
          <Link href={`/org/${org.slug}`} className="os-more" onClick={close}>
            {t("routeDetails")}
          </Link>
        )}
      </section>
    </div>
  );
}
