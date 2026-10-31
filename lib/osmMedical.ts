/**
 * Which OpenStreetMap objects count as "medical help". The OSM tags decide; the name is only a safety net.
 *
 * Shown as medical:
 * - amenity=hospital / amenity=pharmacy / healthcare=hospital / healthcare=pharmacy
 * - emergency=ambulance_station and emergency=yes (a clinic or hospital with emergency care)
 * - amenity=clinic / amenity=doctors / healthcare=clinic / healthcare=doctor, only when
 *   healthcare:speciality is in the allowed set (or healthcare=urgent_care), or when there is
 *   no speciality tag at all and the name has none of the stop-words.
 *
 * Never shown: cosmetic, plastic surgery, aesthetic, fertility, IVF, reproductive, surrogacy,
 * dermatology (unless also general), healthcare=alternative, dentists (unless emergency=yes),
 * veterinary, and anything whose tags do not give a confident answer.
 */

/** `amenity` values that make an object "medical" for the purpose of this filter (it then must pass it). */
const MEDICAL_AMENITIES = new Set([
  "hospital",
  "clinic",
  "pharmacy",
  "doctors",
  "dentist",
  "veterinary",
]);

/** `healthcare=*` values that can be real care; any other value (alternative, psychotherapist, ...) is dropped. */
const MEDICAL_HEALTHCARE = new Set([
  "hospital",
  "clinic",
  "pharmacy",
  "doctor",
  "doctors",
  "emergency",
  "urgent_care",
]);

/** `healthcare:speciality` values that mark general care. */
export const ALLOWED_SPECIALITIES = new Set([
  "general",
  "family_medicine",
  "emergency",
  "urgent_care",
  "paediatrics",
  "pediatrics",
  "internal",
]);

/** Speciality values that always exclude the object (dermatology is handled by the allowed set). */
const EXCLUDED_SPECIALITY =
  /cosmetic|plastic|aesthetic|fertility|ivf|reproductive|surrogacy|sperm|egg_donation|hair_transplant|andrology|tattoo|piercing/i;

/** Safety net only: cosmetic and reproductive business names (en/ru/es/fr/de). Tags decide first. */
const EXCLUDED_NAME =
  /cosmetic|aesthetic|plastic surg|enhancement|fertility|\bivf\b|surrogat|egg donor|sperm|botox|med ?spa|hair (transplant|restoration)|liposuction|laser (hair|skin)|косметолог|эстетич|пластическ|репродукт|суррогат|\bэко\b|фертильн|cosm[eé]tic|esth[eé]tique|reproduc|f[eé]rtil|ästhetik|kosmetik|fruchtbarkeit|leihmutter/i;

function specialities(tags: Record<string, string>): string[] {
  const raw = [
    tags["healthcare:speciality"],
    tags["healthcare:specialty"],
    tags.speciality,
    tags.specialty,
  ];
  return raw
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(";"))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/** True for objects OSM tags as healthcare in any form; these must pass `isGenuineMedicalOsmElement`. */
export function isMedicalOsmElement(tags: Record<string, string>): boolean {
  const amenity = tags.amenity?.toLowerCase();
  if (amenity && MEDICAL_AMENITIES.has(amenity)) return true;
  if (tags.healthcare) return true;
  return tags.emergency === "ambulance_station";
}

/** True when the object is real medical help by its tags. Anything uncertain is false. */
export function isGenuineMedicalOsmElement(
  tags: Record<string, string>,
  name: string,
): boolean {
  const amenity = tags.amenity?.toLowerCase();
  const healthcare = tags.healthcare?.toLowerCase();
  const emergency = tags.emergency?.toLowerCase();
  const specs = specialities(tags);

  // Always excluded.
  if (amenity === "veterinary" || healthcare === "veterinary") return false;
  if (healthcare === "alternative") return false;
  if (specs.some((spec) => EXCLUDED_SPECIALITY.test(spec))) return false;
  if (EXCLUDED_NAME.test(name)) return false;
  if (healthcare && !MEDICAL_HEALTHCARE.has(healthcare)) {
    // dentist is the only non-listed value that may still pass, and only with emergency care.
    return healthcare === "dentist" && emergency === "yes";
  }
  if (amenity === "dentist") return emergency === "yes";

  // Always included.
  if (emergency === "ambulance_station" || emergency === "yes") return true;
  if (
    amenity === "hospital" ||
    amenity === "pharmacy" ||
    healthcare === "hospital" ||
    healthcare === "pharmacy" ||
    healthcare === "emergency" ||
    healthcare === "urgent_care"
  ) {
    return true;
  }

  // Clinics and doctors: the speciality (or its absence plus a neutral name) decides.
  const clinicType =
    amenity === "clinic" ||
    amenity === "doctors" ||
    healthcare === "clinic" ||
    healthcare === "doctor" ||
    healthcare === "doctors";
  if (!clinicType) return false;
  if (specs.length > 0) return specs.some((spec) => ALLOWED_SPECIALITIES.has(spec));
  return true;
}
