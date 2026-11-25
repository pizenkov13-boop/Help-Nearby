import { getOrganizationOpenStatus } from "@/lib/orgUtils";
import type { FilterState, Organization } from "@/lib/types";

export function filterOrganizations(
  orgs: Organization[],
  filters: FilterState,
): Organization[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return orgs.filter((org) => {
    if (
      filters.category !== "all" &&
      !org.categories.includes(filters.category)
    ) {
      return false;
    }
    if (filters.openNow && getOrganizationOpenStatus(org) !== "open") {
      return false;
    }
    if (query) {
      const haystack = [org.name, org.country, org.city, org.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  }).map((org) => filters.category !== "all" && org.category !== filters.category
    ? { ...org, category: filters.category }
    : org);
}
