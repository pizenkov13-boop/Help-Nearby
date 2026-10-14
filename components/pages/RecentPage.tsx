"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { CategoryPill } from "@/components/Filters";
import { OrganizationCard } from "@/components/OrganizationCard";
import { OrganizationListSkeleton } from "@/components/OrganizationCardSkeleton";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categories";
import type { RecentOrganizationsPage } from "@/lib/data";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getOrganizationSource } from "@/lib/organizationSource";
import type { Category, Organization } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentPageProps {
  initial: RecentOrganizationsPage;
  countries: string[];
}

type Filters = { country: string; category: Category | "all" };

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

function formatRelative(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit);
    }
  }
  return rtf.format(0, "minute");
}

/** Consecutive orgs sharing a source + country came from the same batch import. */
function groupBySource(orgs: Organization[]) {
  const groups: {
    key: string;
    label: string;
    country: string;
    orgs: Organization[];
  }[] = [];
  for (const org of orgs) {
    const label = getOrganizationSource(org)?.label ?? "";
    const key = `${label}|${org.country}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.orgs.push(org);
    else groups.push({ key, label, country: org.country, orgs: [org] });
  }
  return groups;
}

export function RecentPage({ initial, countries }: RecentPageProps) {
  const { t, language } = useLanguage();
  const [orgs, setOrgs] = useState<Organization[]>(initial.organizations);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [error, setError] = useState(initial.error);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    country: "",
    category: "all",
  });
  const requestId = useRef(0);

  const categoryLabel = (cat: Category) =>
    ({
      food: t("categoryFood"),
      shelter: t("categoryShelter"),
      medical: t("categoryMedical"),
      clothing: t("categoryClothing"),
      volunteer: t("categoryVolunteer"),
    })[cat];

  const load = useCallback(async (next: Filters, offset: number) => {
    const id = ++requestId.current;
    const params = new URLSearchParams({ offset: String(offset) });
    if (next.country) params.set("country", next.country);
    if (next.category !== "all") params.set("category", next.category);

    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    setError(false);

    try {
      const res = await fetch(`/api/organizations/recent?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RecentOrganizationsPage;
      if (id !== requestId.current) return;
      setOrgs((prev) =>
        offset === 0 ? data.organizations : [...prev, ...data.organizations],
      );
      setHasMore(data.hasMore);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("[RecentPage]", err);
      setError(true);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  const applyFilters = (next: Filters) => {
    setFilters(next);
    setOrgs([]);
    setHasMore(false);
    void load(next, 0);
  };

  const groups = useMemo(() => groupBySource(orgs), [orgs]);

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <PageHero
        compact
        gradient
        title={t("recentTitle")}
        subtitle={t("recentSubtitle")}
      />

      <section className="page-section page-section-compact">
        <div className="container">
          <div className="mb-6 flex flex-col gap-4 rounded-brand border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-surface-card md:flex-row md:items-end">
            <div className="md:w-64">
              <label
                htmlFor="recent-country"
                className="mb-2 block text-sm font-medium text-slate-600 dark:text-gray-400"
              >
                {t("filterCountry")}
              </label>
              <select
                id="recent-country"
                value={filters.country}
                onChange={(e) =>
                  applyFilters({ ...filters, country: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-100"
              >
                <option value="">{t("filterCountryAll")}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 flex-1">
              <span className="mb-2 block text-sm font-medium text-slate-600 dark:text-gray-400">
                {t("filterCategory")}
              </span>
              <div className="flex flex-wrap gap-2">
                <CategoryPill
                  active={filters.category === "all"}
                  onClick={() => applyFilters({ ...filters, category: "all" })}
                  label={t("filterCategoryAll")}
                />
                {CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <CategoryPill
                      key={cat}
                      active={filters.category === cat}
                      onClick={() =>
                        applyFilters({ ...filters, category: cat })
                      }
                      label={categoryLabel(cat)}
                      category={cat}
                      activeClass={cn(cfg.bg, cfg.color, "ring-1", cfg.ring)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div role="status" aria-label={t("recentLoading")}>
              <OrganizationListSkeleton count={4} />
            </div>
          ) : error && orgs.length === 0 ? (
            <div
              className="rounded-brand border border-dashed border-red-500/40 px-6 py-12 text-center"
              role="alert"
            >
              <p className="mb-4 text-[var(--text-dim)]">{t("recentError")}</p>
              <button
                type="button"
                className="cta"
                onClick={() => void load(filters, 0)}
              >
                {t("recentRetry")}
              </button>
            </div>
          ) : orgs.length === 0 ? (
            <p
              className="rounded-brand border border-dashed border-[var(--border-soft)] px-6 py-12 text-center text-[var(--text-dim)]"
              data-testid="recent-empty"
            >
              {t("recentEmpty")}
            </p>
          ) : (
            <div className="space-y-8" data-testid="recent-list">
              {groups.map((group, i) => (
                <div key={`${group.key}-${i}`}>
                  {group.orgs.length > 1 &&
                    group.label &&
                    group.label !== "Help Nearby" && (
                      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                        {group.label}
                        {group.country ? ` · ${group.country}` : ""}
                      </h2>
                    )}
                  <div className="grid w-full min-w-0 gap-3 md:grid-cols-2 md:gap-4">
                    {group.orgs.map((org) => {
                      const relative = formatRelative(org.createdAt, language);
                      return (
                        <OrganizationCard
                          key={org.id}
                          org={org}
                          addedLabel={
                            relative
                              ? t("recentAdded").replace("{date}", relative)
                              : t("recentAddedUnknown")
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {error && (
                <p
                  className="text-center text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {t("recentError")}
                </p>
              )}

              {hasMore && (
                <div className="text-center">
                  <button
                    type="button"
                    className="cta"
                    disabled={loadingMore}
                    onClick={() => void load(filters, orgs.length)}
                  >
                    {loadingMore ? t("recentLoading") : t("recentLoadMore")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
