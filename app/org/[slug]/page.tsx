import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrganizationDetailPage } from "@/components/pages/OrganizationDetailPage";
import { fetchOrganizationBySlug } from "@/lib/data";

interface OrgPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const org = await fetchOrganizationBySlug(params.slug);
  if (!org) {
    return { title: "Organization Not Found — Help Nearby" };
  }
  return {
    title: `${org.name} — Help Nearby`,
    description: org.description,
  };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const org = await fetchOrganizationBySlug(params.slug);
  if (!org) {
    notFound();
  }
  return <OrganizationDetailPage org={org} />;
}
