"use client";

import Link from "next/link";
import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function AboutContent() {
  const { t } = useLanguage();

  const howItWorksCards = [
    {
      title: t("aboutSearchDiscoverTitle"),
      text: t("aboutSearchDiscoverText"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.2-4.2" />
        </svg>
      ),
    },
    {
      title: t("aboutGetHelpCardTitle"),
      text: t("aboutGetHelpCardText"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 13.5l4.5-1.2a3 3 0 0 1 2 .2l2.3 1.1a2 2 0 0 0 1.8 0l4-2a1.6 1.6 0 0 1 2 2.3c-.4.6-1 .9-1.6 1.2L14.5 19a4 4 0 0 1-3 .4L3 17.2" />
          <path d="M12.5 9.5a2.2 2.2 0 0 1 3-3.2l.5.4.5-.4a2.2 2.2 0 0 1 3 3.2L16 12.5z" />
        </svg>
      ),
    },
  ] as const;

  const valuesCards = [
    {
      title: t("aboutValueAccessibilityTitle"),
      text: t("aboutValueAccessibilityText"),
      iconClass: "blue",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.5a3.2 3.2 0 0 1 0 5.2" />
          <path d="M17.5 19a5.5 5.5 0 0 0-3-4.9" />
        </svg>
      ),
    },
    {
      title: t("aboutValueDignityTitle"),
      text: t("aboutValueDignityText"),
      iconClass: "purple",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3.5l1.7 4.6 4.8 1.7-4.8 1.7L12 16.1l-1.7-4.6L5.5 9.8l4.8-1.7z" />
          <path d="M18.5 15.5l.7 1.9 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7z" />
        </svg>
      ),
    },
    {
      title: t("aboutValueGlobalTitle"),
      text: t("aboutValueGlobalText"),
      iconClass: "green",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
        </svg>
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

      <section id="our-story" className="page-section scroll-anchor">
        <div className="container">
          <h2 className="section-title">{t("navOurStory")}</h2>
          <p className="prose-center" style={{ marginTop: "1.5rem" }}>
            {t("aboutStoryText")}
          </p>
        </div>
      </section>

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }} aria-hidden>
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {t("aboutExploreOrgs")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
