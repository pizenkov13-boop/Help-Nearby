import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { SubmitPage } from "@/components/pages/SubmitPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaSubmitTitle")} — ${siteConfig.name}`,
    description: t("metaSubmitDesc"),
  };
}

export default function Submit() {
  if (siteConfig.isCopy) notFound();
  return <SubmitPage />;
}
