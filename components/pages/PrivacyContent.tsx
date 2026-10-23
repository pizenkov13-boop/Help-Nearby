"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PRIVACY_COPY_EN_RU, type PrivacyCopy } from "@/lib/i18n/privacyCopy";
import { PRIVACY_COPY_OTHER } from "@/lib/i18n/privacyCopyOther";
import type { LanguageCode } from "@/lib/types";

/** The privacy text exists in every interface language the site has. */
export const PRIVACY_COPY: Record<LanguageCode, PrivacyCopy> = {
  ...PRIVACY_COPY_EN_RU,
  ...PRIVACY_COPY_OTHER,
};

export function PrivacyContent() {
  const { language } = useLanguage();
  const copy = PRIVACY_COPY[language] ?? PRIVACY_COPY.en;

  return (
    <>
      <PageHead badge={copy.badge} title={copy.title} subtitle={copy.subtitle} />
      <section className="page-section" data-testid="privacy-page">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="text-sm text-slate-500">{copy.updated}</p>
          {copy.sections.map((section) => (
            <div key={section.title} className="mt-8">
              <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mb-3 leading-relaxed text-slate-700 dark:text-gray-300"
                >
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul
                  className="list-disc space-y-2 leading-relaxed text-slate-700 dark:text-gray-300"
                  style={{ paddingInlineStart: "1.25rem" }}
                >
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
