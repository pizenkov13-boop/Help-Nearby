import type { Category } from "@/lib/types";

/** Regional Red Cross offices are not automatically walk-in medical facilities. */
export function isRegionalAidOffice(slug: string): boolean {
  return /^(?:srcs-.+-sudan|rck-.+-kazakhstan|erc-.+-uae|rcb-.+-belarus)$/.test(slug);
}

/** These two food runs also list clothing distribution in the source catalog. */
export const CLOTHING_DISTRIBUTION_SLUGS = [
  "marshrut-nadezhdy-bus-spb",
  "diakonia-bus-spb",
] as const;

export function catalogCategories(slug: string, categories: Category[]): Category[] {
  const adjusted = isRegionalAidOffice(slug)
    ? categories.filter((category) => category !== "medical")
    : [...categories];
  if ((CLOTHING_DISTRIBUTION_SLUGS as readonly string[]).includes(slug) && !adjusted.includes("clothing")) {
    adjusted.push("clothing");
  }
  return adjusted;
}
