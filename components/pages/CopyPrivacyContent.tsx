"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";

interface Section {
  title: string;
  text: string;
}

interface Copy {
  badge: string;
  title: string;
  subtitle: string;
  sections: Section[];
  operatorLabel: string;
  emailLabel: string;
}

const EN: Copy = {
  badge: "Privacy",
  title: "Privacy",
  subtitle: "What this site does and does not collect.",
  sections: [
    {
      title: "Location",
      text: "Your location is requested only when you press the button to find help near you. It is used in your browser and in the search request to find places nearby, and it is not stored on this site's server.",
    },
    {
      title: "Accounts and personal data",
      text: "There are no visitor accounts and no personal data about visitors is collected. If the operator has turned on analytics, it is anonymous.",
    },
    {
      title: "Where the data comes from",
      text: "Places are taken from OpenStreetMap and, if the operator has connected one, from the operator's own database of organizations.",
    },
    {
      title: "Anonymous ping to the template author",
      text: "Once a day this site sends the author of the open-source HelpNearby template an anonymous ping: the site's domain, the software version and the date. It contains no visitor data. The operator can turn it off with DISABLE_PING=true.",
    },
  ],
  operatorLabel: "Site operator",
  emailLabel: "Contact",
};

const RU: Copy = {
  badge: "Приватность",
  title: "Приватность",
  subtitle: "Что этот сайт собирает и чего не собирает.",
  sections: [
    {
      title: "Местоположение",
      text: "Местоположение запрашивается только когда вы нажимаете кнопку поиска помощи рядом. Оно используется в браузере и в поисковом запросе, чтобы найти места поблизости, и не хранится на сервере этого сайта.",
    },
    {
      title: "Аккаунты и личные данные",
      text: "Аккаунтов посетителей нет, личные данные посетителей не собираются. Если оператор включил аналитику, она анонимная.",
    },
    {
      title: "Откуда данные",
      text: "Места берутся из OpenStreetMap и, если оператор подключил свою базу, из его базы организаций.",
    },
    {
      title: "Анонимный пинг автору шаблона",
      text: "Раз в сутки сайт отправляет автору открытого шаблона HelpNearby анонимный пинг: домен сайта, версию программы и дату. Данных посетителей в нём нет. Оператор может отключить его переменной DISABLE_PING=true.",
    },
  ],
  operatorLabel: "Оператор сайта",
  emailLabel: "Контакт",
};

/** Privacy page of a copy: generic, never names the main site's operator. */
export function CopyPrivacyContent() {
  const { language } = useLanguage();
  const copy = language === "ru" ? RU : EN;
  const { operatorName, contactEmail } = siteConfig;

  return (
    <>
      <PageHead badge={copy.badge} title={copy.title} subtitle={copy.subtitle} />
      <section className="page-section" data-testid="privacy-page">
        <div className="container" style={{ maxWidth: 820 }}>
          {copy.sections.map((section) => (
            <div key={section.title} className="mt-8 first:mt-0">
              <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                {section.title}
              </h2>
              <p className="mb-3 leading-relaxed text-slate-700 dark:text-gray-300">
                {section.text}
              </p>
            </div>
          ))}
          {operatorName || contactEmail ? (
            <div className="mt-8">
              <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                {copy.operatorLabel}
              </h2>
              {operatorName ? (
                <p className="mb-1 leading-relaxed text-slate-700 dark:text-gray-300">
                  {operatorName}
                </p>
              ) : null}
              {contactEmail ? (
                <p className="leading-relaxed text-slate-700 dark:text-gray-300">
                  {copy.emailLabel}:{" "}
                  <a className="underline" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
