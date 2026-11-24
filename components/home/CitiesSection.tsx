"use client";

import { TrendingUp, House } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getCitiesInNeed } from "@/lib/i18n/citiesContent";
import type { CityUrgency } from "@/lib/homeContent";
import { cn } from "@/lib/utils";

function badgeClass(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "badge badge-crisis";
  if (urgency === "HIGH NEED") return "badge badge-high";
  return "badge badge-medium";
}

function badgeLabel(urgency: CityUrgency) {
  if (urgency === "CRISIS") return "urgencyCrisis";
  if (urgency === "HIGH NEED") return "urgencyHighNeed";
  return "urgencyVulnerable";
}

function TrendIcon() {
  return (
    <TrendingUp aria-hidden />
  );
}

function HomeIcon() {
  return (
    <House aria-hidden />
  );
}

export function CitiesSection() {
  const { language, t } = useLanguage();
  const citiesInNeed = getCitiesInNeed(language);

  return (
    <section className="cities scroll-anchor" id="cities-in-need">
      <div className="container">
        <div className="cities-head">
          <h2>{t("citiesTitle")}</h2>
          <span className="underline" />
          <p className="sub">
            {t("citiesSubtitle")}
          </p>
        </div>

        <div className="cities-grid">
          {citiesInNeed.map((city) => (
            <article key={city.city} className="city-card">
              <div className="city-head">
                <h3>
                  {city.city}
                  {city.country && (
                    <span className="city-meta">{city.country}</span>
                  )}
                </h3>
                <span className={cn(badgeClass(city.urgency))}>
                  {t(badgeLabel(city.urgency))}
                </span>
              </div>
              <div className="city-rows">
                <div className="city-row">
                  <span className="icon">
                    <TrendIcon />
                  </span>
                  <div className="city-row-body">
                    <span className="city-row-label">{t("cityIssueLabel")}</span>
                    <p className="city-row-text">{city.issue}</p>
                  </div>
                </div>
                <div className="city-row">
                  <span className="icon">
                    <HomeIcon />
                  </span>
                  <div className="city-row-body">
                    <span className="city-row-label">{t("cityProblemLabel")}</span>
                    <p className="city-row-text">{city.problem}</p>
                  </div>
                </div>
                <p className="city-source">
                  <strong>{t("citySourceLabel")}</strong> {city.source}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
