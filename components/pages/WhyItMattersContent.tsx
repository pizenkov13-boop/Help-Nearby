"use client";

import { Globe, Clock, Wifi } from "lucide-react";
import { CitiesSection } from "@/components/home/CitiesSection";
import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function WhyItMattersContent() {
  const { t } = useLanguage();

  const crisisStats = [
    { value: "700M", label: t("whyStat700m"), source: t("whyStat700mSource") },
    { value: "318M", label: t("whyStatHomeless"), source: t("whyStatHomelessSource") },
    { value: "2.3B", label: t("whyStat2_3b"), source: t("whyStat2_3bSource") },
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
        <Globe aria-hidden />
      ),
    },
    {
      title: t("whySolution2Title"),
      text: t("whySolution2Text"),
      iconClass: "purple",
      icon: (
        <Clock aria-hidden />
      ),
    },
    {
      title: t("whySolution3Title"),
      text: t("whySolution3Text"),
      iconClass: "green",
      icon: (
        <Wifi aria-hidden />
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
                {stat.source ? (
                  <p className="l" style={{ fontSize: "0.75rem", opacity: 0.75, marginTop: "0.5rem" }} data-testid="stat-source">
                    {stat.source}
                  </p>
                ) : null}
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
