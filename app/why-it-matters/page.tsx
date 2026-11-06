import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { WhyItMattersContent } from "@/components/pages/WhyItMattersContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaWhyTitle")} — ${siteConfig.name}`,
    description: t("metaWhyDesc"),
  };
}

export default function WhyItMattersPage() {
  if (siteConfig.isCopy) notFound();
  return <WhyItMattersContent />;
}
