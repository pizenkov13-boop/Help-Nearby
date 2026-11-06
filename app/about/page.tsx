import type { Metadata } from "next";
import { AboutContent } from "@/components/pages/AboutContent";
import { CopyAboutContent } from "@/components/pages/CopyAboutContent";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { siteConfig } from "@/lib/siteConfig";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaAboutTitle")} — ${siteConfig.name}`,
    description: siteConfig.isCopy ? t("metaHomeDesc") : t("metaAboutDesc"),
  };
}

export default function AboutPage() {
  return siteConfig.isCopy ? <CopyAboutContent /> : <AboutContent />;
}
