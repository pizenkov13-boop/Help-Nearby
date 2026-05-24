import type { Organization } from "@/lib/types";

/** OSM healthcare=* values that are routine care, not crisis services. */
const ROUTINE_HEALTHCARE = new Set([
  "physiotherapist",
  "physiotherapy",
  "osteopath",
  "acupuncture",
  "dentist",
  "dental",
  "laboratory",
  "blood_test",
  "sample_collection",
  "cosmetics",
  "cosmetic",
  "beauty",
  "chiropractor",
  "alternative",
  "podiatrist",
  "occupational_therapist",
  "speech_therapist",
  "optometrist",
  "audiologist",
  "nutrition",
  "massage",
  "spa",
  "reflexologist",
  "homeopath",
  "naturopath",
  "herbalist",
  "yoga",
  "pilates",
  "vaccination",
  "counselling",
  "counseling",
]);

const ROUTINE_NAME_PATTERN =
  /\b(physio|physioth|osteopath|acupun|dental|dentist|laborator|\blab\b|beauty|wellness|spa\b|massage|yoga|pilates|chiropract|cosmetic|aesthetic|dermatolog|optician|hearing\s*aid|wellbeing|acupuncture|blood\s*test|diagnostic)\b/i;

const EXPLICIT_EMERGENCY_VALUES = new Set([
  "yes",
  "emergency_ward",
  "department",
  "ambulance_station",
]);

/** Serialize OSM tags used for emergency filtering into hoursRaw. */
export function buildEmergencyMetadataRaw(
  tags: Record<string, string>,
): string {
  const parts: string[] = [];
  if (tags.opening_hours?.trim()) parts.push(tags.opening_hours.trim());
  if (tags.emergency) parts.push(`emergency:${tags.emergency}`);
  if (tags.healthcare) parts.push(`healthcare:${tags.healthcare}`);
  if (tags.amenity) parts.push(`amenity:${tags.amenity}`);
  return parts.join("; ");
}

export function isOsmOpeningHours247(openingHours: string | undefined): boolean {
  if (!openingHours?.trim()) return false;
  const normalized = openingHours.toLowerCase().replace(/\s+/g, " ");

  if (
    normalized.includes("24/7") ||
    normalized.includes("24-7") ||
    normalized.includes("24 hours") ||
    normalized.includes("24hrs") ||
    normalized.includes("24 hrs")
  ) {
    return true;
  }

  if (/00:00\s*[-–]\s*(24:00|23:59)/.test(normalized)) {
    return true;
  }

  return /mo[-\s]*su.*00:00\s*[-–]\s*24:00/i.test(openingHours);
}

function hasExplicitEmergencyTag(tags: Record<string, string>): boolean {
  const emergency = tags.emergency?.toLowerCase();
  if (emergency && EXPLICIT_EMERGENCY_VALUES.has(emergency)) {
    return true;
  }

  const healthcare = tags.healthcare?.toLowerCase();
  return healthcare === "emergency" || healthcare === "urgent_care";
}

function isCrisisPublicSafetyAmenity(amenity: string | undefined): boolean {
  return amenity === "fire_station" || amenity === "police";
}

function isExcludedRoutineCare(
  tags: Record<string, string>,
  name: string,
): boolean {
  const healthcare = tags.healthcare?.toLowerCase() ?? "";
  if (healthcare && ROUTINE_HEALTHCARE.has(healthcare)) {
    return true;
  }

  if (tags.amenity === "doctors") {
    return true;
  }

  if (ROUTINE_NAME_PATTERN.test(name)) {
    return true;
  }

  if (tags.shop === "beauty" || tags.leisure === "spa") {
    return true;
  }

  const amenity = tags.amenity?.toLowerCase();
  if (amenity === "clinic" && !hasExplicitEmergencyTag(tags)) {
    return true;
  }

  if (
    amenity === "hospital" &&
    (healthcare === "nursing_home" || healthcare === "hospice")
  ) {
    return true;
  }

  return false;
}

/**
 * True when an OSM element is a genuine 24/7 or emergency crisis facility.
 * Used at Overpass parse time (full tags available).
 */
export function isGenuineEmergencyOsmFacility(
  tags: Record<string, string>,
): boolean {
  const name =
    tags.name ?? tags.brand ?? tags.operator ?? tags["addr:housename"] ?? "";

  if (isExcludedRoutineCare(tags, name)) {
    return false;
  }

  const amenity = tags.amenity?.toLowerCase();

  if (isCrisisPublicSafetyAmenity(amenity)) {
    return true;
  }

  if (tags.emergency === "ambulance_station") {
    return true;
  }

  if (hasExplicitEmergencyTag(tags)) {
    if (amenity === "pharmacy") {
      return isOsmOpeningHours247(tags.opening_hours);
    }
    return true;
  }

  if (amenity === "pharmacy") {
    return isOsmOpeningHours247(tags.opening_hours);
  }

  if (amenity === "hospital") {
    return true;
  }

  return false;
}

function metadataIncludes(
  hoursRaw: string,
  key: string,
  value?: string,
): boolean {
  const needle = value ? `${key}:${value}` : `${key}:`;
  return hoursRaw.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Filter parsed organizations (e.g. from Overpass metadata in hoursRaw).
 */
export function isGenuineEmergencyOrganization(org: Organization): boolean {
  const raw = org.hoursRaw ?? "";
  const name = `${org.name} ${org.description ?? ""}`;

  if (ROUTINE_NAME_PATTERN.test(name)) {
    return false;
  }

  if (metadataIncludes(raw, "amenity", "police")) return true;
  if (metadataIncludes(raw, "amenity", "fire_station")) return true;
  if (metadataIncludes(raw, "emergency", "ambulance_station")) return true;

  if (
    metadataIncludes(raw, "emergency", "yes") ||
    metadataIncludes(raw, "emergency", "emergency_ward") ||
    metadataIncludes(raw, "emergency", "department") ||
    metadataIncludes(raw, "healthcare", "emergency") ||
    metadataIncludes(raw, "healthcare", "urgent_care")
  ) {
    if (metadataIncludes(raw, "amenity", "pharmacy")) {
      return isOsmOpeningHours247(raw.split(";")[0]?.trim());
    }
    return true;
  }

  if (metadataIncludes(raw, "amenity", "pharmacy")) {
    return isOsmOpeningHours247(raw.split(";")[0]?.trim() ?? raw);
  }

  if (metadataIncludes(raw, "amenity", "hospital")) {
    const healthcare = raw.match(/healthcare:([^\s;]+)/i)?.[1]?.toLowerCase();
    if (healthcare && ROUTINE_HEALTHCARE.has(healthcare)) return false;
    if (healthcare === "nursing_home" || healthcare === "hospice") {
      return false;
    }
    return true;
  }

  return false;
}

/** Higher priority = listed first (before distance sort within tier). */
export function emergencyFacilityPriority(org: Organization): number {
  const raw = (org.hoursRaw ?? "").toLowerCase();

  if (raw.includes("emergency:ambulance_station")) return 0;
  if (
    raw.includes("emergency:yes") ||
    raw.includes("emergency:emergency_ward") ||
    raw.includes("healthcare:emergency")
  ) {
    return 1;
  }
  if (raw.includes("amenity:hospital")) return 2;
  if (raw.includes("healthcare:urgent_care")) return 3;
  if (raw.includes("amenity:fire_station") || raw.includes("amenity:police")) {
    return 4;
  }
  if (raw.includes("amenity:pharmacy")) return 5;
  return 6;
}
