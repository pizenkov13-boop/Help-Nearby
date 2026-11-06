import type { Metadata } from "next";
import { CopyPrivacyContent } from "@/components/pages/CopyPrivacyContent";
import { PrivacyContent } from "@/components/pages/PrivacyContent";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaPrivacyTitle")} — ${siteConfig.name}`,
    description: t("metaPrivacyDesc"),
    alternates: {
      canonical: siteConfig.isCopy ? absoluteUrl("/privacy") : "https://www.help-nearby.org/privacy",
    },
  };
}

export default function PrivacyPage() {
  return siteConfig.isCopy ? <CopyPrivacyContent /> : <PrivacyContent />;
}
