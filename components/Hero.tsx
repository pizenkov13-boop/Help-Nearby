"use client";

import { Loader2, Search } from "lucide-react";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HeroProps {
  onFindHelp: () => void;
  onSelectCategory: (category: Category) => void;
  isLocating: boolean;
  liteModeActive?: boolean;
}

export function Hero({ onFindHelp, onSelectCategory, isLocating }: HeroProps) {
  const { t } = useLanguage();

  const categoryLabel = (cat: Category) =>
    ({
      food: t("categoryFood"),
      shelter: t("categoryShelter"),
      medical: t("categoryMedical"),
      clothing: t("categoryClothing"),
      volunteer: t("categoryVolunteer"),
    })[cat];

  return (
    <section className="hero" id="hero">
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="hero-grad" />

      <div className="hero-inner">
        <div className="hero-content">
          <h1>{t("heroTitle")}</h1>
          <p className="lead">{t("heroSubtitle")}</p>

          <div className="hero-tiles-wrap">
            <h2 className="hero-tiles-title">{t("homeNeedTitle")}</h2>
            <ul className="hero-tiles">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    className={cn("hero-tile", `tile-${cat}`)}
                    onClick={() => onSelectCategory(cat)}
                    disabled={isLocating}
                  >
                    <span className="tile-icon" aria-hidden>
                      <CategoryIcon category={cat} />
                    </span>
                    {categoryLabel(cat)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="hero-cta-main"
            onClick={onFindHelp}
            disabled={isLocating}
          >
            {isLocating ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 22, height: 22 }} aria-hidden />
                {t("locating")}
              </>
            ) : (
              <>
                <Search style={{ width: 22, height: 22 }} aria-hidden />
                {t("heroCta")}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
          <path
            fill="currentColor"
            d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,90.7C672,85,768,75,864,69.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  );
}
