import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/siteConfig";
import { metaTranslator } from "@/lib/i18n/pageMeta";
import { RecentPage } from "@/components/pages/RecentPage";
import {
  fetchRecentOrganizations,
  fetchVerifiedCountries,
} from "@/lib/data";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = await metaTranslator();
  const title = `${t("metaRecentTitle")} — ${siteConfig.name}`;
  const description = t("metaRecentDesc");
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: siteConfig.name },
  };
}

const SSR_TIMEOUT_MS = 8000;

/** Don't let an unreachable database block the whole page render. */
function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), SSR_TIMEOUT_MS)),
  ]);
}

export default async function Recent() {
  if (siteConfig.isCopy) notFound();
  const [initial, countries] = await Promise.all([
    withTimeout(fetchRecentOrganizations(), {
      organizations: [],
      hasMore: false,
      error: true,
    }),
    withTimeout(fetchVerifiedCountries(), [] as string[]),
  ]);

  return <RecentPage initial={initial} countries={countries} />;
}
