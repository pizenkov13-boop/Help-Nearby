"use client";

import { Filter } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Category, FilterState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

/**
 * Desktop: a sidebar card. Phones: one horizontally scrollable row of chips
 * (categories + "Open now") so the filters take a single line instead of a tall block.
 */
export function Filters({ filters, onChange }: FiltersProps) {
  const { t } = useLanguage();

  const categoryLabel = (cat: Category) => {
    const map = {
      food: t("categoryFood"),
      shelter: t("categoryShelter"),
      medical: t("categoryMedical"),
      clothing: t("categoryClothing"),
      volunteer: t("categoryVolunteer"),
    } as const;
    return map[cat];
  };

  return (
    <aside
      className={cn(
        "transition-colors duration-300",
        "lg:sticky lg:top-20 lg:rounded-brand lg:border lg:border-slate-200 lg:bg-white lg:p-4 lg:shadow-lg",
        "dark:lg:border-white/10 dark:lg:bg-surface-card",
      )}
    >
      <div className="mb-4 hidden items-center gap-2 text-slate-900 dark:text-white lg:flex">
        <Filter
          className="size-5 shrink-0 text-blue-500 dark:text-blue-400"
          aria-hidden
        />
        <h2 className="m-0 text-base font-semibold leading-5">{t("filtersTitle")}</h2>
      </div>

      <div
        className={cn(
          "-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "md:-mx-7 md:px-7",
          "lg:mx-0 lg:flex-col lg:items-stretch lg:gap-5 lg:overflow-visible lg:p-0",
        )}
        role="group"
        aria-label={t("filtersTitle")}
      >
        <div className="contents lg:block">
          <span className="sr-only lg:not-sr-only lg:mb-2 lg:block lg:text-sm lg:font-medium lg:text-slate-600 dark:lg:text-gray-400">
            {t("filterCategory")}
          </span>
          <div className="contents lg:flex lg:flex-wrap lg:gap-2">
            <CategoryPill
              active={filters.category === "all"}
              onClick={() => onChange({ ...filters, category: "all" })}
              label={t("filterCategoryAll")}
            />
            {CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <CategoryPill
                  key={cat}
                  active={filters.category === cat}
                  onClick={() => onChange({ ...filters, category: cat })}
                  label={categoryLabel(cat)}
                  category={cat}
                  activeClass={cn(cfg.bg, cfg.color, "ring-1", cfg.ring)}
                />
              );
            })}
          </div>
        </div>

        <label
          className={cn(
            "flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 transition-colors hover:border-teal-500/40",
            "min-h-11 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-emerald-500/40",
            "lg:gap-3 lg:rounded-lg lg:py-2.5",
          )}
        >
          <input
            type="checkbox"
            checked={filters.openNow}
            onChange={(e) =>
              onChange({ ...filters, openNow: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500 dark:border-gray-600 dark:bg-gray-800 dark:text-emerald-500 dark:focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
            {t("filterOpenNow")}
          </span>
        </label>
      </div>
    </aside>
  );
}

export function CategoryPill({
  active,
  onClick,
  label,
  category,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  category?: Category;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-all hover:border-slate-300",
        "dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600",
        "lg:min-h-0 lg:gap-1 lg:px-3 lg:py-1 lg:text-xs",
        active && (activeClass ?? "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"),
      )}
    >
      {category && <CategoryIcon category={category} className="h-4 w-4 lg:h-3.5 lg:w-3.5" />}
      {label}
    </button>
  );
}
