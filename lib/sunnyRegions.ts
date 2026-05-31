import { normalizeCountryName } from "@/lib/liteMode";

/** ISO 3166-1 alpha-2 — all African countries. */
const AFRICAN_COUNTRY_CODES = new Set([
  "dz", // Algeria
  "ao", // Angola
  "bj", // Benin
  "bw", // Botswana
  "bf", // Burkina Faso
  "bi", // Burundi
  "cv", // Cabo Verde
  "cm", // Cameroon
  "cf", // Central African Republic
  "td", // Chad
  "km", // Comoros
  "cg", // Congo
  "cd", // DR Congo
  "ci", // Côte d'Ivoire
  "dj", // Djibouti
  "eg", // Egypt
  "gq", // Equatorial Guinea
  "er", // Eritrea
  "sz", // Eswatini
  "et", // Ethiopia
  "ga", // Gabon
  "gm", // Gambia
  "gh", // Ghana
  "gn", // Guinea
  "gw", // Guinea-Bissau
  "ke", // Kenya
  "ls", // Lesotho
  "lr", // Liberia
  "ly", // Libya
  "mg", // Madagascar
  "mw", // Malawi
  "ml", // Mali
  "mr", // Mauritania
  "mu", // Mauritius
  "ma", // Morocco
  "mz", // Mozambique
  "na", // Namibia
  "ne", // Niger
  "ng", // Nigeria
  "rw", // Rwanda
  "st", // São Tomé and Príncipe
  "sn", // Senegal
  "sc", // Seychelles
  "sl", // Sierra Leone
  "so", // Somalia
  "za", // South Africa
  "ss", // South Sudan
  "sd", // Sudan
  "tz", // Tanzania
  "tg", // Togo
  "tn", // Tunisia
  "ug", // Uganda
  "zm", // Zambia
  "zw", // Zimbabwe
]);

/** Arabian Peninsula and adjacent hot/desert Gulf states. */
const ARABIAN_PENINSULA_CODES = new Set([
  "sa", // Saudi Arabia
  "ae", // UAE
  "om", // Oman
  "ye", // Yemen
  "qa", // Qatar
  "bh", // Bahrain
  "kw", // Kuwait
  "iq", // Iraq
]);

/** Other sunny Middle East / South Asia belt (bright outdoor use). */
const SUNNY_MENA_SOUTH_ASIA_CODES = new Set([
  "ir", // Iran
  "jo", // Jordan
  "sy", // Syria
  "lb", // Lebanon
  "ps", // Palestine
  "il", // Israel
  "pk", // Pakistan
  "af", // Afghanistan
  "bd", // Bangladesh
  "lk", // Sri Lanka
  "mv", // Maldives
]);

const SUNNY_REGION_CODES = new Set([
  ...AFRICAN_COUNTRY_CODES,
  ...ARABIAN_PENINSULA_CODES,
  ...SUNNY_MENA_SOUTH_ASIA_CODES,
]);

/** Fallback when ISO code is missing from geocoder. */
const SUNNY_REGION_NAMES = new Set([
  "algeria",
  "angola",
  "benin",
  "botswana",
  "burkina faso",
  "burundi",
  "cabo verde",
  "cameroon",
  "central african republic",
  "chad",
  "comoros",
  "congo",
  "democratic republic of the congo",
  "dem. rep. congo",
  "dr congo",
  "congo, the democratic republic of the",
  "congo, democratic republic of the",
  "cote d'ivoire",
  "côte d'ivoire",
  "ivory coast",
  "djibouti",
  "egypt",
  "equatorial guinea",
  "eritrea",
  "eswatini",
  "swaziland",
  "ethiopia",
  "gabon",
  "gambia",
  "ghana",
  "guinea",
  "guinea-bissau",
  "kenya",
  "lesotho",
  "liberia",
  "libya",
  "madagascar",
  "malawi",
  "mali",
  "mauritania",
  "mauritius",
  "morocco",
  "mozambique",
  "namibia",
  "niger",
  "nigeria",
  "rwanda",
  "sao tome and principe",
  "são tomé and príncipe",
  "senegal",
  "seychelles",
  "sierra leone",
  "somalia",
  "south africa",
  "south sudan",
  "sudan",
  "tanzania",
  "togo",
  "tunisia",
  "uganda",
  "zambia",
  "zimbabwe",
  "saudi arabia",
  "united arab emirates",
  "uae",
  "oman",
  "yemen",
  "qatar",
  "bahrain",
  "kuwait",
  "iraq",
  "iran",
  "jordan",
  "syria",
  "lebanon",
  "palestine",
  "state of palestine",
  "israel",
  "pakistan",
  "afghanistan",
  "bangladesh",
  "sri lanka",
  "maldives",
]);

/**
 * True for Africa, Arabian Peninsula, and other high-sun regions where
 * a light UI is easier to read outdoors.
 */
export function isSunnyRegionCountry(
  country: string | null | undefined,
  countryCode?: string | null,
): boolean {
  if (countryCode) {
    const code = countryCode.trim().toLowerCase();
    if (SUNNY_REGION_CODES.has(code)) return true;
  }

  if (!country) return false;

  const normalized = normalizeCountryName(country);
  if (SUNNY_REGION_NAMES.has(normalized)) return true;

  return (
    normalized.includes("democratic republic") &&
    normalized.includes("congo")
  );
}
