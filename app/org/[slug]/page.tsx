import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizationDetailPage } from "@/components/pages/OrganizationDetailPage";
import { fetchOrganizationBySlug } from "@/lib/data";
import { buildOrganizationJsonLd, serializeJsonLd } from "@/lib/orgJsonLd";
import {
  buildOrgDescription,
  buildOrgTitle,
  orgCanonicalUrl,
} from "@/lib/orgSeo";

export const runtime = "nodejs";

interface OrgPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await fetchOrganizationBySlug(slug);
  if (!org) {
    return { title: "Organization Not Found — Help Nearby", robots: { index: false } };
  }

  const title = buildOrgTitle(org);
  const description = buildOrgDescription(org);
  const url = orgCanonicalUrl(org.slug);
  const images = [{ url: "/og-image.png", width: 1200, height: 630, alt: "Help Nearby" }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Help Nearby",
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params;
  const org = await fetchOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Our own data, serialized with "<" escaped so it cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildOrganizationJsonLd(org)) }}
      />
      <OrganizationDetailPage org={org} />
    </>
  );
}
