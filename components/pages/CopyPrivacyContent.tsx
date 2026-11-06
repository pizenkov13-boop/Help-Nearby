"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { COPY_PRIVACY } from "@/lib/i18n/copyPrivacyCopy";
import { siteConfig } from "@/lib/siteConfig";

/** Privacy page of a copy: generic, never names the main site's operator. */
export function CopyPrivacyContent() {
  const { language } = useLanguage();
  const copy = COPY_PRIVACY[language] ?? COPY_PRIVACY.en;
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
