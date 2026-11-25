import { NOCHLEZHKA_SOURCE_SLUGS } from "@/lib/nochlezhkaSourceSlugs";
import type { Organization } from "@/lib/types";

export interface OrganizationSource {
  label: string;
  url?: string;
}

type SourceInput = Pick<
  Organization,
  "id" | "slug" | "website" | "description" | "country" | "verified"
>;

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function fromDescription(description: string): OrganizationSource | null {
  if (/справочник\s+ночлежки/i.test(description)) {
    return { label: "Ночлежка", url: "https://homeless.ru/for-homeless/" };
  }
  const match = description.match(/(?:Источник|Source):\s*((?:https?:\/\/)?[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?:\/[^\s]*)?)/iu);
  if (!match?.[1]) return null;
  const value = match[1].replace(/[.,;]+$/, "");
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const host = hostFromUrl(url);
  if (!host) return null;
  const label = value.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "");
  return { label, url };
}

/** Display label for verified catalog entries (Supabase seeds, admin-approved). */
export function getOrganizationSource(org: SourceInput): OrganizationSource | null {
  if (!org.verified) return null;

  const slug = org.slug.toLowerCase();
  const siteHost = org.website?.trim() ? hostFromUrl(org.website.trim()) : null;
  if (slug.startsWith("crf-") && /croix-rouge\.fr\/annuaire/i.test(org.description ?? "")) {
    return {
      label: "croix-rouge.fr",
      url: siteHost === "croix-rouge.fr" ? org.website.trim() : "https://www.croix-rouge.fr/annuaire",
    };
  }
  if (NOCHLEZHKA_SOURCE_SLUGS.has(slug)) {
    return { label: "Ночлежка", url: "https://homeless.ru/for-homeless/" };
  }

  const id = org.id.toLowerCase();
  const website = org.website?.trim() ?? "";

  if (slug.startsWith("hdx-") || id.startsWith("hdx-")) {
    return { label: "HDX", url: "https://data.humdata.org" };
  }
  if (slug.startsWith("gdho-") || id.startsWith("gdho-")) {
    return {
      label: "GDHO",
      url: "https://humanitarianoutcomes.org/projects/gdho",
    };
  }
  if (slug.startsWith("rw-") || id.startsWith("rw-")) {
    return { label: "ReliefWeb", url: "https://reliefweb.int" };
  }

  if (slug.startsWith("srcs-") && slug.endsWith("-sudan")) {
    return { label: "srcs.sd", url: "https://www.srcs.sd/en/our-branches" };
  }
  if (slug.startsWith("rck-") && slug.endsWith("-kazakhstan")) {
    return { label: "redcrescent.kz", url: "https://redcrescent.kz/ru/" };
  }
  if (slug.startsWith("erc-") && slug.endsWith("-uae")) {
    return { label: "emiratesrc.ae", url: "https://www.emiratesrc.ae/en/about/contact" };
  }
  if (slug === "rcb-gomel-belarus") {
    return { label: "redcross-gomel.by", url: "https://redcross-gomel.by/" };
  }
  if (slug.startsWith("rcb-") && slug.endsWith("-belarus")) {
    return { label: "redcross.by", url: "https://redcross.by" };
  }

  const fromDesc = org.description ? fromDescription(org.description) : null;
  if (fromDesc) return fromDesc;

  if (siteHost === "redcross-gomel.by") {
    return { label: "redcross-gomel.by", url: website };
  }

  if (
    slug.includes("nochlezhka") ||
    website.includes("homeless.ru") ||
    website.includes("nochelezhka.ru") ||
    website.includes("ночлежка.рф")
  ) {
    return {
      label: "Nochlezhka",
      url: "https://homeless.ru",
    };
  }

  return null;
}
