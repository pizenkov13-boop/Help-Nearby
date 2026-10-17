import { hasValidMapCoordinates } from "@/lib/mapCoordinates";
import { orgCanonicalUrl } from "@/lib/orgSeo";
import { isApproximateLocation } from "@/lib/organizationCoordinates";
import { getOrganizationOpenStatus } from "@/lib/orgUtils";
import type { Organization, Weekday } from "@/lib/types";

const SCHEMA_DAYS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type JsonLd = Record<string, unknown>;

function httpUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/** Only hours that are really known: per-day schedules, or an explicit 24/7. Never "Closed". */
function openingHours(org: Organization): JsonLd[] | null {
  const specs: JsonLd[] = [];

  for (const day of Object.keys(SCHEMA_DAYS) as Weekday[]) {
    const schedule = org.hours?.[day];
    if (schedule) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[day],
        opens: schedule.open,
        closes: schedule.close,
      });
    }
  }
  if (specs.length > 0) return specs;

  const raw = org.hoursRaw?.trim();
  if (raw && /24\s*\/\s*7/.test(raw) && getOrganizationOpenStatus(org) === "open") {
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: Object.values(SCHEMA_DAYS),
        opens: "00:00",
        closes: "23:59",
      },
    ];
  }
  return null;
}

/**
 * schema.org markup for an organization page.
 * - geo only for exact coordinates (never for approximate OCHA entries);
 * - LocalBusiness only for places with a physical address;
 * - openingHoursSpecification only when hours are genuinely known.
 */
export function buildOrganizationJsonLd(org: Organization): JsonLd {
  const approximate = isApproximateLocation(org);
  const street = approximate ? "" : (org.address?.trim() ?? "");
  const hasPhysicalAddress = Boolean(street);

  const types = [org.verified ? "NGO" : "Organization"];
  if (hasPhysicalAddress) types.push("LocalBusiness");

  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": types.length === 1 ? types[0] : types,
    "@id": orgCanonicalUrl(org.slug),
    name: org.name,
    url: orgCanonicalUrl(org.slug),
  };

  if (org.description?.trim()) data.description = org.description.trim();

  const address: JsonLd = { "@type": "PostalAddress" };
  if (street) address.streetAddress = street;
  if (org.city?.trim()) address.addressLocality = org.city.trim();
  if (org.country?.trim()) address.addressCountry = org.country.trim();
  if (Object.keys(address).length > 1) data.address = address;

  if (org.phone?.trim()) data.telephone = org.phone.trim();

  const site = httpUrl(org.website);
  if (site) data.sameAs = [site];

  if (!approximate && hasValidMapCoordinates(org)) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: org.lat,
      longitude: org.lng,
    };
  }

  const hours = approximate ? null : openingHours(org);
  if (hours) data.openingHoursSpecification = hours;

  return data;
}

/** JSON for an inline <script type="application/ld+json">: "<" is escaped so it can never close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  // Built from char codes so no raw U+2028/U+2029 line separators appear in this source file.
  const lineSeparator = new RegExp(String.fromCharCode(0x2028), "g");
  const paragraphSeparator = new RegExp(String.fromCharCode(0x2029), "g");
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(lineSeparator, "\\u2028")
    .replace(paragraphSeparator, "\\u2029");
}
