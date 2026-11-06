/**
 * Translation audit: every language has exactly the same keys as English, no value is empty,
 * and no value is a copy of the English text unless it is a proper noun / technical string.
 * Exits with code 1 on any problem:  npm run test:i18n
 */
import { translations, LANGUAGES } from "../lib/i18n/translations";
import { COPY_PRIVACY } from "../lib/i18n/copyPrivacyCopy";

type Flat = Record<string, string>;

function flatten(value: unknown, prefix = "", out: Flat = {}): Flat {
  if (typeof value === "string") out[prefix] = value;
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

/** Same text in every language on purpose: names, example data, symbols. */
const SAME_EVERYWHERE = new Set([
  "brand",
  // Partner / product names and handles
  "footerPartnerTelegram",
  "footerPartnerWebsite",
  "footerTelegram",
  "footerWebsite",
  "footerPartnerName",
  "footerGitHub",
  "sourceOsmPending",
  "submitPhPhone",
  "submitPhEmail",
  "submitPhWebsite",
]);

/** Allowed to equal English in the listed languages only (cognates, loanwords, proper nouns). */
const SAME_IN: Record<string, string[]> = {
  navChat: ["es", "fr", "de"],
  urgencyCrisis: ["es"],
  urgencyVulnerable: ["es"],
  citiesBadgeCrisis: ["es"],
  citiesBadgeVulnerable: ["es"],
  routeMin: ["es", "fr"],
  routeHr: ["es", "fr"],
  submitLabelDescription: ["fr"],
  submitLabelName: ["de"],
  submitLabelWebsite: ["de"],
  citiesSourceLabel: ["fr"],
  menuTitle: ["fr"],
  routeDistance: ["fr"],
  cityProblemLabel: ["de"],
  citiesProblemLabel: ["de"],
  routeDetails: ["de"],
  emailLabel: ["fr"],
};

const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

function isNonLinguistic(value: string): boolean {
  // digits, punctuation, emoji, URLs, e-mails: nothing to translate
  const stripped = value.replace(/https?:\/\/\S+|\S+@\S+|[^\p{L}]/gu, "");
  return stripped.length === 0;
}

function auditSet(name: string, sets: Record<string, Flat>, problems: string[], strictSame: boolean) {
  const en = sets.en;
  for (const code of LANGUAGE_CODES) {
    const set = sets[code];
    if (!set) {
      problems.push(`[${name}] language ${code} is missing`);
      continue;
    }
    for (const key of Object.keys(en)) if (!(key in set)) problems.push(`[${name}] ${code}: missing key ${key}`);
    for (const key of Object.keys(set)) if (!(key in en)) problems.push(`[${name}] ${code}: extra key ${key}`);
    for (const [key, value] of Object.entries(set)) {
      if (typeof value !== "string" || value.trim() === "") {
        problems.push(`[${name}] ${code}: empty value for ${key}`);
        continue;
      }
      if (code === "en" || !strictSame || !(key in en)) continue;
      if (value === en[key] && !SAME_EVERYWHERE.has(key) && !SAME_IN[key]?.includes(code) && !isNonLinguistic(value)) {
        problems.push(`[${name}] ${code}: ${key} is identical to English ("${value}")`);
      }
    }
  }
}

const problems: string[] = [];
auditSet("translations", Object.fromEntries(Object.entries(translations).map(([c, v]) => [c, flatten(v)])), problems, true);
auditSet("copyPrivacy", Object.fromEntries(Object.entries(COPY_PRIVACY).map(([c, v]) => [c, flatten(v)])), problems, true);

if (problems.length) {
  console.error(`i18n audit failed: ${problems.length} problem(s)\n` + problems.join("\n"));
  process.exit(1);
}
console.log(`i18n audit passed: ${Object.keys(translations.en).length} keys x ${LANGUAGE_CODES.length} languages`);
