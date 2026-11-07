/**
 * Countries where the automatic ("Auto") theme is light: all of Africa, the Arabian Peninsula and the hot
 * Middle East / South Asia belt, where a light UI is easier to read outdoors. ISO 3166-1 alpha-2, lower case.
 * This is the only list: the server (Vercel country header, app/layout.tsx) and the browser fallback
 * (a country found by a search) both read it. Everywhere else Auto follows the device setting.
 */
export const SUNNY_COUNTRY_CODES: ReadonlySet<string> = new Set([
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
  "sa", // Saudi Arabia
  "ae", // UAE
  "om", // Oman
  "ye", // Yemen
  "qa", // Qatar
  "bh", // Bahrain
  "kw", // Kuwait
  "iq", // Iraq
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
])

/** True for a country code (any case) in SUNNY_COUNTRY_CODES. */
export function isSunnyCountryCode(code: string | null | undefined): boolean {
  return Boolean(code) && SUNNY_COUNTRY_CODES.has(code!.trim().toLowerCase());
}
