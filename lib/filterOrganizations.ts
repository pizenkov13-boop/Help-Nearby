import { isPharmacyOrganization } from "@/lib/pharmacyFilter";
import { isConfidentlyOpen } from "@/lib/confidentOpenStatus";
import type { FilterState, Organization } from "@/lib/types";

export function filterOrganizations(
  orgs: Organization[],
  filters: FilterState,
): Organization[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return orgs.filter((org) => {
    // Reject older cached pharmacy results as well as newly fetched ones.
    if (isPharmacyOrganization(org)) return false;
    if (
      filters.category !== "all" &&
      !org.categories.includes(filters.category)
    ) {
      return false;
    }
    if (filters.openNow && !isConfidentlyOpen(org)) {
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
