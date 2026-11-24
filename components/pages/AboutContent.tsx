"use client";

import Link from "next/link";
import { Search, HandHeart, Users, Sparkles, Globe, MapPin } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function AboutContent() {
  const { t } = useLanguage();

  const howItWorksCards = [
    {
      title: t("aboutSearchDiscoverTitle"),
      text: t("aboutSearchDiscoverText"),
      icon: (
        <Search aria-hidden />
      ),
    },
    {
      title: t("aboutGetHelpCardTitle"),
      text: t("aboutGetHelpCardText"),
      icon: (
        <HandHeart aria-hidden />
      ),
    },
  ] as const;

  const valuesCards = [
    {
      title: t("aboutValueAccessibilityTitle"),
      text: t("aboutValueAccessibilityText"),
      iconClass: "blue",
      icon: (
        <Users aria-hidden />
      ),
    },
    {
      title: t("aboutValueDignityTitle"),
      text: t("aboutValueDignityText"),
      iconClass: "purple",
      icon: (
        <Sparkles aria-hidden />
      ),
    },
    {
      title: t("aboutValueGlobalTitle"),
      text: t("aboutValueGlobalText"),
      iconClass: "green",
      icon: (
        <Globe aria-hidden />
      ),
    },
  ] as const;

  return (
    <>
      <PageHead
        badge={t("aboutPageTitle")}
        title={t("aboutPageTitle")}
        subtitle={t("aboutPageSubtitle")}
      />

      <section id="how-it-works" className="page-section alt scroll-anchor">
        <div className="container">
          <div className="hiw-head">
            <h2>{t("navHowItWorks")}</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-2" style={{ marginTop: "3rem" }}>
            {howItWorksCards.map((card) => (
              <article key={card.title} className="page-card" style={{ textAlign: "center" }}>
                <div className="card-icon grad center">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="hiw-head">
            <h2>{t("aboutValuesTitle")}</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-3" style={{ marginTop: "3rem" }}>
            {valuesCards.map((card) => (
              <article key={card.title} className="page-card" style={{ textAlign: "center" }}>
                <div className={`card-icon ${card.iconClass} center`}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
          <div className="page-cta-wrap">
            <Link href="/" className="cta">
              <MapPin aria-hidden />
              {t("aboutExploreOrgs")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
