import type { Organization } from "@/lib/types";

export interface OrganizationSource {
  label: string;
  url?: string;
}

type SourceInput = Pick<
  Organization,
  "slug" | "website" | "description" | "country" | "verified"
>;

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function fromDescription(description: string): OrganizationSource | null {
  const match = description.match(/(?:Источник|Source):\s*([^\s.]+(?:\.[^\s.]+)*)/i);
  if (!match?.[1]) return null;

  const label = match[1].replace(/\.$/, "");
  const url = label.startsWith("http") ? label : `https://${label}`;
  return { label: hostFromUrl(url) ?? label, url };
}

/** Display label for verified catalog entries (Supabase seeds, admin-approved). */
export function getOrganizationSource(org: SourceInput): OrganizationSource | null {
  if (!org.verified) return null;

  const fromDesc = org.description ? fromDescription(org.description) : null;
  if (fromDesc) return fromDesc;

  const slug = org.slug.toLowerCase();
  const website = org.website?.trim() ?? "";

  if (slug.startsWith("srcs-") && slug.endsWith("-sudan")) {
    return { label: "srcs.sd", url: "https://www.srcs.sd" };
  }
  if (slug.startsWith("rck-") && slug.endsWith("-kazakhstan")) {
    return { label: "redcrescent.kz", url: "https://redcrescent.kz" };
  }
  if (slug.startsWith("erc-") && slug.endsWith("-uae")) {
    return { label: "emiratesrc.ae", url: "https://emiratesrc.ae" };
  }
  if (slug.startsWith("rcb-") && slug.endsWith("-belarus")) {
    return { label: "redcross.by", url: "https://redcross.by" };
  }

  const siteHost = website ? hostFromUrl(website) : null;
  if (siteHost === "redcross-gomel.by") {
    return { label: "redcross-gomel.by", url: website };
  }

  if (
    org.country === "Russia" ||
    slug.includes("nochlezhka") ||
    website.includes("homeless.ru") ||
    website.includes("nochelezhka.ru")
  ) {
    return {
      label: "Nochelezhka",
      url: website.includes("homeless.ru")
        ? "https://homeless.ru"
        : "https://nochelezhka.ru",
    };
  }

  if (siteHost) {
    return { label: siteHost, url: website };
  }

  return { label: "Help Nearby" };
}
