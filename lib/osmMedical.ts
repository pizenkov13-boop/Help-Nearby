/**
 * Which OpenStreetMap objects count as "medical help".
 * Only real care: hospital, clinic, pharmacy, doctors, emergency, ambulance.
 * Cosmetic, fertility, surrogacy and similar commercial clinics are dropped.
 */

const MEDICAL_AMENITIES = new Set(["hospital", "clinic", "pharmacy", "doctors"]);

/** `healthcare=*` values that are real care. */
const MEDICAL_HEALTHCARE = new Set([
  "hospital",
  "clinic",
  "pharmacy",
  "doctor",
  "doctors",
  "emergency",
  "ambulance",
  "ambulance_station",
  "urgent_care",
]);

/** Anything in `healthcare`, `healthcare:speciality` or `speciality` matching this is not crisis help. */
const EXCLUDED_TAG_VALUE =
  /cosmetic|aesthetic|plastic|beauty|fertility|reproduct|sperm|egg_donation|surrogat|ivf|hair_transplant|andrology|tattoo|piercing/i;

/** Name keywords (en/ru/es/fr/de) of cosmetic and reproductive businesses. */
const EXCLUDED_NAME =
  /cosmetic|aesthetic|plastic surg|enhancement|fertility|\bivf\b|surrogat|egg donor|sperm|botox|med ?spa|hair (transplant|restoration)|liposuction|laser (hair|skin)|косметолог|эстетич|пластическ|репродукт|суррогат|\bэко\b|фертильн|cosm[eé]tic|esth[eé]tique|reproduc|f[eé]rtil|ästhetik|kosmetik|fruchtbarkeit|leihmutter/i;

function hasMedicalTag(tags: Record<string, string>): boolean {
  const amenity = tags.amenity?.toLowerCase();
  if (amenity && MEDICAL_AMENITIES.has(amenity)) return true;
  if (tags.healthcare) return true;
  return tags.emergency === "ambulance_station";
}

/** True for objects that OSM tags as healthcare in any form (before the relevance filter). */
export function isMedicalOsmElement(tags: Record<string, string>): boolean {
  return hasMedicalTag(tags);
}

/** True when the object is real medical help; false for cosmetic, fertility and similar businesses. */
export function isGenuineMedicalOsmElement(
  tags: Record<string, string>,
  name: string,
): boolean {
  const amenity = tags.amenity?.toLowerCase();
  const healthcare = tags.healthcare?.toLowerCase();

  const allowedByTag =
    (amenity !== undefined && MEDICAL_AMENITIES.has(amenity)) ||
    (healthcare !== undefined && MEDICAL_HEALTHCARE.has(healthcare)) ||
    tags.emergency === "ambulance_station";
  if (!allowedByTag) return false;

  const tagValues = [
    tags.healthcare,
    tags["healthcare:speciality"],
    tags.speciality,
    tags["healthcare:specialty"],
    tags.specialty,
  ].filter((value): value is string => Boolean(value));
  if (tagValues.some((value) => EXCLUDED_TAG_VALUE.test(value))) return false;

  return !EXCLUDED_NAME.test(name);
}
