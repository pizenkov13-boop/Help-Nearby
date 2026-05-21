"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

const STEPS: {
  step: number;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    step: 1,
    titleKey: "howItWorksStep1Title",
    descriptionKey: "howItWorksStep1Description",
  },
  {
    step: 2,
    titleKey: "howItWorksStep2Title",
    descriptionKey: "howItWorksStep2Description",
  },
  {
    step: 3,
    titleKey: "howItWorksStep3Title",
    descriptionKey: "howItWorksStep3Description",
  },
];

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="hiw" id="how-it-works">
      <div className="container">
        <div className="hiw-head">
          <h2>{t("howItWorksTitle")}</h2>
          <span className="underline" />
        </div>

        <div className="hiw-grid">
          {STEPS.map((item) => (
            <article key={item.step} className="step">
              <div className="step-num">{item.step}</div>
              <h3>{t(item.titleKey)}</h3>
              <p>{t(item.descriptionKey)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
