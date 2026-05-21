import { fetchOrganizationBySlug } from "@/lib/data";
import type { Organization } from "@/lib/types";

export {
  formatDaySchedule,
  formatTime12h,
  formatWeeklyHours,
  getDirectionsUrl,
  getPhoneTelUrl,
  isOrganizationOpen,
  slugify,
} from "@/lib/orgUtils";

export async function getOrganizationBySlug(
  slug: string,
): Promise<Organization | null> {
  return fetchOrganizationBySlug(slug);
}
