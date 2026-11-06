"use client";

import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function NotFoundContent() {
  const { t } = useLanguage();
  return (
    <>
      <PageHero compact gradient title={t("notFoundTitle")} subtitle={t("notFoundText")} />
      <section className="page-section page-section-compact">
        <div className="container text-center">
          <Link href="/" className="cta" data-testid="not-found-home">
            {t("notFoundHome")}
          </Link>
        </div>
      </section>
    </>
  );
}
