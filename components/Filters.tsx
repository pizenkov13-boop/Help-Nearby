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
    <aside className="rounded-brand border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-colors duration-300 dark:border-white/10 dark:bg-surface-card/90 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
        <Filter className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        <h2 className="font-semibold">{t("filtersTitle")}</h2>
      </div>

      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-sm font-medium text-slate-600 dark:text-gray-400">
            {t("filterCategory")}
          </span>
          <div className="flex flex-wrap gap-2">
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

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition-colors hover:border-teal-500/40 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-emerald-500/40">
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

function CategoryPill({
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
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600",
        active && (activeClass ?? "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"),
      )}
    >
      {category && <CategoryIcon category={category} />}
      {label}
    </button>
  );
}
