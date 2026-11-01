"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";

/** Short neutral "About" page of a copy: no story, team or figures of the main site. */
export function CopyAboutContent() {
  const { language } = useLanguage();
  const ru = language === "ru";
  const { operatorName } = siteConfig;

  const title = ru ? "О проекте" : "About";
  const lead = ru
    ? "Этот сайт помогает найти бесплатную помощь рядом: еду, жильё, медицинскую помощь, одежду и волонтёрство. Он показывает места на карте по данным OpenStreetMap и, если оператор подключил свою базу, организации из неё."
    : "This site helps people find free help nearby: food, shelter, medical aid, clothing and volunteering. It shows places on a map from OpenStreetMap and, if the operator has connected one, organizations from the operator's own database.";
  const based = ru
    ? "Это местная версия открытой платформы HelpNearby (автор Pavel Izenkin)."
    : "This is a local version of the open-source HelpNearby platform (by Pavel Izenkin).";
  const operated = operatorName
    ? ru
      ? `Сайт ведёт: ${operatorName}.`
      : `Operated by ${operatorName}.`
    : null;

  return (
    <>
      <PageHead badge={title} title={title} subtitle="" />
      <section className="page-section">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="mb-4 leading-relaxed text-slate-700 dark:text-gray-300">{lead}</p>
          <p className="mb-4 leading-relaxed text-slate-700 dark:text-gray-300">
            {based}{" "}
            <a className="underline" href="https://www.help-nearby.org/" target="_blank" rel="noopener">
              HelpNearby
            </a>
          </p>
          {operated ? (
            <p className="leading-relaxed text-slate-700 dark:text-gray-300">{operated}</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
