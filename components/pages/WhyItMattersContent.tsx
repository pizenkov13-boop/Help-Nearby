"use client";

import { CitiesSection } from "@/components/home/CitiesSection";
import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function WhyItMattersContent() {
  const { t } = useLanguage();

  const crisisStats = [
    { value: "700M", label: t("whyStat700m") },
    { value: "150M", label: t("whyStat150m") },
    { value: "2.3B", label: t("whyStat2_3b") },
  ] as const;

  const problemCards = [
    {
      title: t("whyProblem1Title"),
      text: t("whyProblem1Text"),
    },
    {
      title: t("whyProblem2Title"),
      text: t("whyProblem2Text"),
    },
    {
      title: t("whyProblem3Title"),
      text: t("whyProblem3Text"),
    },
  ] as const;

  const solutionCards = [
    {
      title: t("whySolution1Title"),
      text: t("whySolution1Text"),
      iconClass: "blue",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <ellipse cx="12" cy="12" rx="4" ry="9" />
        </svg>
      ),
    },
    {
      title: t("whySolution2Title"),
      text: t("whySolution2Text"),
      iconClass: "purple",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3 1.8" />
        </svg>
      ),
    },
    {
      title: t("whySolution3Title"),
      text: t("whySolution3Text"),
      iconClass: "green",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 9.5a13 13 0 0 1 19 0" />
          <path d="M6.5 14a7.5 7.5 0 0 1 11 0" />
          <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
  ] as const;

  return (
    <>
      <PageHead
        badge={t("whyPageTitle")}
        title={t("whyPageTitle")}
        subtitle={t("whyPageSubtitle")}
      />

      <section id="the-problem" className="page-section scroll-anchor">
        <div className="container">
          <div className="hiw-head no-rule">
            <div className="alert-badge">
              <span className="dot">!</span>
            </div>
            <h2>{t("navTheProblem")}</h2>
          </div>

          <div className="page-card-grid cols-3" style={{ marginTop: "2.5rem" }}>
            {crisisStats.map((stat) => (
              <div key={stat.value} className="page-card stat-card">
                <p className="v">{stat.value}</p>
                <p className="l">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="page-card-grid cols-3" style={{ marginTop: "1.5rem" }}>
            {problemCards.map((card) => (
              <article key={card.title} className="page-card problem-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="our-solution" className="page-section alt scroll-anchor">
        <div className="container">
          <div className="hiw-head">
            <h2>{t("navOurSolution")}</h2>
            <span className="underline" />
          </div>
          <div className="page-card-grid cols-3" style={{ marginTop: "3rem" }}>
            {solutionCards.map((card) => (
              <article key={card.title} className="page-card">
                <div className={`card-icon ${card.iconClass}`}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CitiesSection />
    </>
  );
}
