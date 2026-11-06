import type { Metadata } from "next";
import { DisclaimerContent } from "@/components/pages/DisclaimerContent";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { absoluteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaDisclaimerTitle")} — ${siteConfig.name}`,
    description: t("metaDisclaimerDesc"),
    alternates: { canonical: absoluteUrl("/disclaimer") },
  };
}

export default function DisclaimerPage() {
  return <DisclaimerContent />;
}
