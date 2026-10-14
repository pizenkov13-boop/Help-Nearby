import type { Metadata } from "next";
import { RecentPage } from "@/components/pages/RecentPage";
import {
  fetchRecentOrganizations,
  fetchVerifiedCountries,
} from "@/lib/data";

export const revalidate = 300;

const title = "Recently Added Organizations — Help Nearby";
const description =
  "Newly verified food banks, shelters, medical aid and volunteer organizations added to Help Nearby.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Help Nearby" },
};

const SSR_TIMEOUT_MS = 8000;

/** Don't let an unreachable database block the whole page render. */
function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), SSR_TIMEOUT_MS)),
  ]);
}

export default async function Recent() {
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
