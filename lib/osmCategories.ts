import { isGenuineMedicalOsmElement, isMedicalOsmElement } from "@/lib/osmMedical";
import type { Category } from "@/lib/types";

/**
 * Which OpenStreetMap objects belong to which of the five categories. Every category is an
 * explicit tag allowlist; an object that passes none of them is not shown at all (there is no
 * "other" bucket and no fallback category).
 *
 * food       amenity=food_bank | amenity=community_fridge | social_facility=food_bank | soup_kitchen.
 *            amenity=give_box (unattended boxes) is never shown.
 * shelter    social_facility=shelter, or a NAMED amenity=shelter that is not a bus stop / public
 *            transport object, has no shelter_type of public_transport, picnic_shelter,
 *            basic_hut, weather_shelter, lean_to (field_shelter, rock_shelter, gazebo too) and
 *            carries a sign of crisis shelter (social_facility(:for), homeless=yes, emergency=yes).
 * clothing   social_facility=clothing_bank | charity=clothes | shop=charity that sells second-hand
 *            goods or clothes. Ordinary clothing shops and plain charity shops are not shown.
 * volunteer  social_facility=outreach | office=ngo|charity with a sign of help | amenity=community_centre
 *            with a sign of help. charity=yes alone, other social_facility values (nursing_home,
 *            group_home, assisted_living, ...) and unmatched objects are not shown.
 * medical    decided in osmMedical.ts.
 *
 * Objects with access=private|no are never shown in the four help categories.
 */

const EXCLUDED_SHELTER_TYPES = new Set([
  "public_transport",
  "picnic_shelter",
  "basic_hut",
  "weather_shelter",
  "lean_to",
  "field_shelter",
  "rock_shelter",
  "gazebo",
]);

const NGO_HELP_TYPE = /humanitarian|charit|social|relief|refugee|volunteer/i;
const CENTRE_HELP_FOR = /social_facility|refugee|migrant|homeless|poor|low_income|crisis|aid/i;

/**
 * Overpass selectors per category. The nearby and the chat query are both built from this table.
 * They only fetch candidates: the exact allowlist is `classifyOsmCategory`. Negated or ["name"]
 * filters are deliberately absent, they make Overpass time out (26 s for amenity=shelter in London).
 */
export const OSM_CATEGORY_SELECTORS: Record<Category, string[]> = {
  food: [
    '["amenity"="food_bank"]',
    '["amenity"="community_fridge"]',
    '["social_facility"="food_bank"]',
    '["social_facility"="soup_kitchen"]',
  ],
  shelter: [
    '["social_facility"="shelter"]',
    '["amenity"="shelter"]',
  ],
  medical: [
    '["amenity"="clinic"]',
    '["amenity"="hospital"]',
    '["amenity"="pharmacy"]',
    '["amenity"="doctors"]',
    '["emergency"="ambulance_station"]',
  ],
  clothing: [
    '["social_facility"="clothing_bank"]',
    '["charity"="clothes"]',
    '["shop"="charity"]["second_hand"~"^(yes|only)$"]',
    '["shop"="charity"]["clothes"]',
  ],
  volunteer: [
    '["social_facility"="outreach"]',
    '["office"~"^(ngo|charity)$"]',
    '["amenity"="community_centre"]["community_centre:for"]',
    '["amenity"="community_centre"]["social_facility:for"]',
  ],
};

const values = (value: string | undefined): string[] =>
  (value ?? "")
    .split(";")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

const isYes = (value: string | undefined): boolean => value?.trim().toLowerCase() === "yes";

function isOpenToPublic(tags: Record<string, string>): boolean {
  const access = tags.access?.trim().toLowerCase();
  return access !== "private" && access !== "no";
}

function hasHelpSigns(tags: Record<string, string>): boolean {
  return isYes(tags.volunteer) || isYes(tags.volunteers) || Boolean(tags["social_facility:for"]?.trim());
}

function isFood(tags: Record<string, string>): boolean {
  const amenity = tags.amenity?.trim().toLowerCase();
  if (amenity === "food_bank" || amenity === "community_fridge") return true;
  const social = values(tags.social_facility);
  return social.includes("food_bank") || social.includes("soup_kitchen");
}

function isShelter(tags: Record<string, string>): boolean {
  if (values(tags.social_facility).includes("shelter")) return true;
  if (tags.amenity?.trim().toLowerCase() !== "shelter") return false;
  if (!tags.name?.trim()) return false;
  if (tags.highway?.toLowerCase() === "bus_stop" || tags.public_transport || isYes(tags.bus)) return false;
  const types = values(tags.shelter_type);
  if (types.some((type) => EXCLUDED_SHELTER_TYPES.has(type))) return false;
  // A named amenity=shelter is mostly a park hut or pavilion (all 5 in central London), so it also
  // needs a sign of crisis shelter. Real shelters are tagged social_facility=shelter instead.
  return (
    Boolean(tags.social_facility?.trim()) ||
    Boolean(tags["social_facility:for"]?.trim()) ||
    isYes(tags.homeless) ||
    tags.emergency?.trim().toLowerCase() === "yes" ||
    types.some((type) => /emergency|homeless|night/.test(type))
  );
}

function isClothing(tags: Record<string, string>): boolean {
  if (values(tags.social_facility).includes("clothing_bank")) return true;
  if (values(tags.charity).includes("clothes")) return true;
  if (tags.shop?.trim().toLowerCase() !== "charity") return false;
  const secondHand = tags.second_hand?.trim().toLowerCase();
  const clothes = tags.clothes?.trim().toLowerCase();
  return secondHand === "yes" || secondHand === "only" || Boolean(clothes && clothes !== "no");
}

function isVolunteer(tags: Record<string, string>): boolean {
  if (values(tags.social_facility).includes("outreach")) return true;
  const office = tags.office?.trim().toLowerCase();
  if (office === "ngo" || office === "charity") {
    return hasHelpSigns(tags) || NGO_HELP_TYPE.test(tags["ngo:type"] ?? "");
  }
  if (tags.amenity?.trim().toLowerCase() === "community_centre") {
    return hasHelpSigns(tags) || CENTRE_HELP_FOR.test(tags["community_centre:for"] ?? "");
  }
  return false;
}

/**
 * The category of an OSM object, or null when it passes no allowlist (then it is not shown).
 * Help categories are checked first, medical last, in the order food, shelter, clothing, volunteer.
 */
export function classifyOsmCategory(tags: Record<string, string>, name: string): Category | null {
  if (tags.amenity?.trim().toLowerCase() !== "give_box" && isOpenToPublic(tags)) {
    if (isFood(tags)) return "food";
    if (isShelter(tags)) return "shelter";
    if (isClothing(tags)) return "clothing";
    if (isVolunteer(tags)) return "volunteer";
  }
  if (isMedicalOsmElement(tags) && isGenuineMedicalOsmElement(tags, name)) return "medical";
  return null;
}
