"use client";

import { PageHead } from "@/components/layout/PageHead";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";

/** Short neutral "About" page of a copy: no story, team or figures of the main site. */
export function CopyAboutContent() {
  const { t } = useLanguage();
  const { operatorName } = siteConfig;

  const title = t("copyAboutTitle");
  const lead = t("copyAboutLead");
  // "{link}" in the text is where the HelpNearby link goes.
  const [basedBefore, basedAfter = ""] = t("copyAboutBased").split("{link}");
  const operated = operatorName ? t("copyAboutOperated").replace("{name}", operatorName) : null;

  return (
    <>
      <PageHead badge={title} title={title} subtitle="" />
      <section className="page-section">
        <div className="container" style={{ maxWidth: 820 }}>
          <p className="mb-4 leading-relaxed text-slate-700 dark:text-gray-300">{lead}</p>
          <p className="mb-4 leading-relaxed text-slate-700 dark:text-gray-300">
            {basedBefore}
            <a className="underline" href="https://www.help-nearby.org/" target="_blank" rel="noopener">
              HelpNearby
            </a>
            {basedAfter}
          </p>
          {operated ? (
            <p className="leading-relaxed text-slate-700 dark:text-gray-300">{operated}</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
