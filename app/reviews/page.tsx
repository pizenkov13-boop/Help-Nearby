import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { ReviewsPage } from "@/components/pages/ReviewsPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaReviewsTitle")} — ${siteConfig.name}`,
    description: t("metaReviewsDesc"),
  };
}

export default function Reviews() {
  if (siteConfig.isCopy) notFound();
  return <ReviewsPage />;
}
