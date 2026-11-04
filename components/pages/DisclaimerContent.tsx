"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/** Same text on the main site and on every copy: no operator name, no contacts, no places. */
export function DisclaimerContent() {
  const { t } = useLanguage();

  return (
    <>
      <PageHead badge={t("navDisclaimer")} title={t("navDisclaimer")} />
      <section className="page-section" data-testid="disclaimer-page">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="leading-relaxed text-slate-700 dark:text-gray-300">{t("disclaimerText")}</p>
        </div>
      </section>
    </>
  );
}
