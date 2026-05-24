"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import {
  trackCallOrganization,
  trackGetDirections,
} from "@/lib/analytics.client";
import { CATEGORY_CONFIG } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  formatWeeklyHours,
  getDirectionsUrl,
  getPhoneTelUrl,
  isOrganizationOpen,
} from "@/lib/orgUtils";
import type { Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrganizationDetailPageProps {
  org: Organization;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = rating >= index + 1;
        const half = !filled && rating > index && rating < index + 1;
        return (
          <Star
            key={index}
            className={cn(
              "h-5 w-5",
              filled
                ? "fill-amber-400 text-amber-400"
                : half
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-gray-600 dark:text-gray-700",
            )}
          />
        );
      })}
      <span className="ml-1 text-sm font-medium text-amber-400">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function OrganizationDetailPage({ org }: OrganizationDetailPageProps) {
  const { t } = useLanguage();
  const cfg = CATEGORY_CONFIG[org.category];
  const open = isOrganizationOpen(org);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const directionsUrl = getDirectionsUrl(org);
  const telUrl = getPhoneTelUrl(org.phone);
  const hoursLines = formatWeeklyHours(org.hours);

  return (
    <SiteLayout>
      <div className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </div>
      </div>

      <header className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-blue-600/20 via-gray-50 to-emerald-600/20 px-4 py-10 dark:border-gray-800 dark:from-blue-900/30 dark:via-gray-900 dark:to-emerald-900/20 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                cfg.bg,
                cfg.color,
              )}
            >
              {cfg.icon} {org.category}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
                open
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-700/80 text-gray-400",
              )}
            >
              <Clock className="h-4 w-4" />
              {open ? t("openNow") : t("closed")}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {org.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{org.country}</span>
            {org.distance && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-blue-400">{org.distance}</span>
              </>
            )}
          </div>

          <div className="mt-4">
            <StarRating rating={org.rating} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={telUrl}
            onClick={() => trackCallOrganization(org)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-emerald-500"
          >
            <Phone className="h-5 w-5" />
            {t("callNow")}
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGetDirections(org)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-900 transition-colors hover:border-blue-500/50 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700/50"
          >
            <Navigation className="h-5 w-5 text-blue-400" />
            {t("getDirections")}
          </a>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-4 text-lg font-semibold text-gray-900 transition-colors hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700/50"
          >
            <Share2 className="h-5 w-5" />
            {copied ? t("copied") : t("share")}
          </button>
        </div>

        {org.description && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("description")}
            </h2>
            <p className="leading-relaxed text-gray-600 dark:text-gray-400">
              {org.description}
            </p>
          </section>
        )}

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-800/40">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t("contactDetails")}
          </h2>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300">{org.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="h-5 w-5 shrink-0 text-gray-500" />
              <a
                href={telUrl}
                className="text-gray-600 hover:text-emerald-400 dark:text-gray-300"
              >
                {org.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="h-5 w-5 shrink-0 text-gray-500" />
              <a
                href={`mailto:${org.email}`}
                className="break-all text-gray-600 hover:text-blue-400 dark:text-gray-300"
              >
                {org.email}
              </a>
            </li>
            {org.website && (
              <li className="flex gap-3">
                <Globe className="h-5 w-5 shrink-0 text-gray-500" />
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-blue-500 hover:text-blue-400 dark:text-blue-400"
                >
                  {org.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            )}
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                {hoursLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          </ul>
        </section>
      </div>
    </SiteLayout>
  );
}

