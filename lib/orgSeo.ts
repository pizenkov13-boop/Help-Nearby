import { absoluteUrl } from "@/lib/seo";
import type { Organization } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  shelter: "Shelter",
  medical: "Medical aid",
  clothing: "Clothing",
  volunteer: "Volunteering",
};

export const META_DESCRIPTION_MAX = 155;

export function orgCategoryLabel(org: Pick<Organization, "category">): string {
  return CATEGORY_LABELS[org.category] ?? "Help";
}

function place(org: Pick<Organization, "city" | "country">): string {
  return [org.city?.trim(), org.country?.trim()].filter(Boolean).join(", ");
}

/** "{Name} — {category} in {city}, {country} | HelpNearby" (the "in …" part only when the place is known). */
export function buildOrgTitle(org: Organization): string {
  const where = place(org);
  return `${org.name} — ${orgCategoryLabel(org)}${where ? ` in ${where}` : ""} | HelpNearby`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/** The real description (at most 155 characters), or a category + place template when there is none. */
export function buildOrgDescription(org: Organization): string {
  const real = org.description?.replace(/\s+/g, " ").trim();
  if (real) return truncate(real, META_DESCRIPTION_MAX);

  const where = place(org);
  return truncate(
    `${org.name}: ${orgCategoryLabel(org).toLowerCase()} help${where ? ` in ${where}` : ""}. Contact details and directions on Help Nearby.`,
    META_DESCRIPTION_MAX,
  );
}

export function orgCanonicalUrl(slug: string): string {
  return absoluteUrl(`/org/${encodeURIComponent(slug)}`);
}
