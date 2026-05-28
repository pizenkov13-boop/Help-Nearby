"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatImpactCounter } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

interface HeroProps {
  onFindHelp: () => void;
  isLocating: boolean;
  impactCount: number | null;
  liteModeActive?: boolean;
}

export function Hero({
  onFindHelp,
  isLocating,
  impactCount,
  liteModeActive = false,
}: HeroProps) {
  const { t, language } = useLanguage();

  return (
    <section className="hero" id="hero">
      <div
        className="hero-bg"
        style={liteModeActive ? undefined : { backgroundImage: "url(/images/hero.jpg)" }}
      />
      <div className="hero-overlay" />
      <div className="hero-grad" />

      <div className="hero-inner">
        <div className="hero-content">
          {impactCount !== null && (
            <div className="hero-live">
              <span className="pulse" />
              {formatImpactCounter(language, impactCount)}
            </div>
          )}

          <h1>
            {language === "en" ? (
              <>
                Find help <span className="grad">near you</span>
              </>
            ) : (
              t("heroTitle")
            )}
          </h1>

          <p className="lead">{t("heroSubtitle")}</p>

          <div className="cta-row">
            <button
              type="button"
              className={cn("cta")}
              onClick={onFindHelp}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <Loader2
                    className="inline-block animate-spin"
                    style={{ width: 18, height: 18 }}
                  />
                  {t("locating")}
                </>
              ) : (
                <>
                  {t("heroCta")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
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
