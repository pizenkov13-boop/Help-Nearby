import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { formsDisabledForHeaders } from "@/lib/featureFlags.server";
import { SubmitPage } from "@/components/pages/SubmitPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  return {
    title: `${t("metaSubmitTitle")} — ${siteConfig.name}`,
    description: t("metaSubmitDesc"),
  };
}

export default async function Submit() {
  if (siteConfig.isCopy) notFound();
  // Visitors from FORMS_DISABLED_COUNTRIES never see the form: straight to the home page.
  if (formsDisabledForHeaders(await headers())) redirect("/");
  return <SubmitPage />;
}
