import "server-only";

import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import { nominatimSearch } from "@/lib/nominatim.server";
import { fetchNearbyOverpassOrganizations } from "@/lib/overpass.server";
import type { Category, Organization, UserLocation } from "@/lib/types";

const CHAT_SEARCH_RADIUS_METERS = NEARBY_RADIUS_METERS * 4;

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  food: [
    "food",
    "meal",
    "meals",
    "hunger",
    "grocer",
    "еда",
    "еду",
    "еды",
    "пищ",
    "продукт",
    "покуш",
    "голод",
    "столов",
    "comida",
    "nourriture",
    "essen",
    "食物",
    "طعام",
  ],
  shelter: [
    "shelter",
    "housing",
    "homeless",
    "приют",
    "жиль",
    "ночлег",
    "refugio",
    "abri",
    "unterkunft",
    "庇护",
    "مأوى",
  ],
  medical: [
    "medical",
    "medicine",
    "doctor",
    "hospital",
    "clinic",
    "health",
    "медиц",
    "врач",
    "больниц",
    "клиник",
    "здоров",
    "médic",
    "gesund",
    "医疗",
    "طب",
  ],
  clothing: [
    "clothing",
    "clothes",
    "одежд",
    "ropa",
    "vêtement",
    "kleidung",
    "衣服",
    "ملابس",
  ],
  volunteer: [
    "volunteer",
    "volunteers",
    "волонт",
    "benevol",
    "freiwill",
    "志愿",
    "تطوع",
  ],
};

const STOP_WORDS = new Set([
  "need",
  "needs",
  "help",
  "near",
  "nearby",
  "where",
  "find",
  "looking",
  "want",
  "please",
  "any",
  "some",
  "the",
  "and",
  "for",
  "with",
  "нужна",
  "нужен",
  "нужно",
  "нужны",
  "помощ",
  "помог",
  "найти",
  "где",
  "есть",
  "можно",
  "хочу",
  "ищу",
  "дай",
  "дайте",
  "в",
  "во",
  "in",
  "at",
  "on",
  "to",
  "from",
  "around",
  "около",
  "рядом",
  "с",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectCategory(query: string): Category | null {
  const normalized = normalizeText(query);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Category,
    string[],
  ][]) {
    if (keywords.some((word) => normalized.includes(word))) {
      return category;
    }
  }
  return null;
}

function stripCategoryWords(normalizedQuery: string): string {
  let result = normalizedQuery;
  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      result = result.replaceAll(keyword, " ");
    }
  }
  return result.replace(/\s+/g, " ").trim();
}

function tokensMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const prefixLength = Math.min(a.length, b.length, 6);
  return a.slice(0, prefixLength) === b.slice(0, prefixLength);
}

/** City/country phrase from any language, e.g. "прокопьевске", "new york", "berlin". */
export function extractPlaceQuery(query: string): string | null {
  const normalized = normalizeText(query);
  let place = stripCategoryWords(normalized);

  for (const stopWord of STOP_WORDS) {
    place = place.replace(new RegExp(`\\b${stopWord}\\b`, "gu"), " ");
  }

  place = place.replace(/\s+/g, " ").trim();
  if (place.length >= 3) return place;
  return null;
}

function collectKnownPlaces(organizations: Organization[]): string[] {
  const places = new Set<string>();
  for (const org of organizations) {
    if (org.city.trim()) places.add(normalizeText(org.city));
    if (org.country.trim()) places.add(normalizeText(org.country));
  }
  return Array.from(places).filter((place) => place.length >= 3);
}

function findKnownPlacesInQuery(
  normalizedQuery: string,
  organizations: Organization[],
): string[] {
  return collectKnownPlaces(organizations).filter(
    (place) =>
      normalizedQuery.includes(place) ||
      normalizedQuery.split(" ").some((token) => tokensMatch(token, place)),
  );
}

function orgMatchesKnownPlaces(
  org: Organization,
  knownPlaces: string[],
): boolean {
  if (knownPlaces.length === 0) return false;

  const city = normalizeText(org.city);
  const country = normalizeText(org.country);
  const address = normalizeText(org.address);

  return knownPlaces.some(
    (place) =>
      tokensMatch(city, place) ||
      tokensMatch(country, place) ||
      tokensMatch(address, place),
  );
}

function orgMatchesPlaceQuery(org: Organization, placeQuery: string): boolean {
  const haystack = normalizeText(
    [org.city, org.address, org.country, org.name].filter(Boolean).join(" "),
  );
  if (!haystack) return false;

  if (tokensMatch(haystack, placeQuery)) return true;

  return placeQuery
    .split(" ")
    .filter((token) => token.length >= 3)
    .some((token) =>
      haystack.split(" ").some((part) => tokensMatch(part, token)),
    );
}

function filterByCategory(
  organizations: Organization[],
  category: Category | null,
): Organization[] {
  if (!category) return organizations;
  return organizations.filter((org) => org.categories.includes(category));
}

function dedupeOrganizations(organizations: Organization[]): Organization[] {
  const seen = new Set<string>();
  const unique: Organization[] = [];

  for (const org of organizations) {
    const key = `${org.name}|${org.lat}|${org.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(org);
  }

  return unique;
}

function scoreOrganization(
  org: Organization,
  placeQuery: string | null,
  knownPlaces: string[],
  category: Category | null,
): number {
  let score = 0;

  if (category && org.categories.includes(category)) score += 5;
  if (org.verified) score += 2;

  const city = normalizeText(org.city);
  const address = normalizeText(org.address);
  const country = normalizeText(org.country);

  for (const place of knownPlaces) {
    if (city && tokensMatch(city, place)) score += 14;
    if (address && tokensMatch(address, place)) score += 10;
    if (country && tokensMatch(country, place)) score += 6;
  }

  if (placeQuery) {
    if (city && tokensMatch(city, placeQuery)) score += 12;
    if (address && tokensMatch(address, placeQuery)) score += 8;
    if (country && tokensMatch(country, placeQuery)) score += 4;

    for (const token of placeQuery.split(" ").filter((part) => part.length >= 3)) {
      if (city && tokensMatch(city, token)) score += 10;
      if (address && tokensMatch(address, token)) score += 6;
    }
  }

  return score;
}

async function fetchNearbyForCoordinates(
  location: UserLocation,
  category: Category | null,
): Promise<Organization[]> {
  const [catalog, overpass] = await Promise.all([
    fetchOrganizations(location, { radiusMeters: CHAT_SEARCH_RADIUS_METERS }),
    fetchNearbyOverpassOrganizations(
      location.lat,
      location.lng,
      CHAT_SEARCH_RADIUS_METERS,
    ),
  ]);

  return filterByCategory(
    mergeOrganizations(catalog, overpass),
    category,
  ).slice(0, 8);
}

async function searchCatalogByText(
  query: string,
  allOrganizations: Organization[],
  category: Category | null,
  limit: number,
): Promise<Organization[]> {
  const normalizedQuery = normalizeText(query);
  const placeQuery = extractPlaceQuery(query);
  const knownPlaces = findKnownPlacesInQuery(normalizedQuery, allOrganizations);

  return allOrganizations
    .map((org) => ({
      org,
      score: scoreOrganization(org, placeQuery, knownPlaces, category),
    }))
    .filter(({ org, score }) => {
      if (score <= 0) return false;
      if (category && !org.categories.includes(category)) return false;
      if (knownPlaces.length > 0) return orgMatchesKnownPlaces(org, knownPlaces);
      if (placeQuery) return orgMatchesPlaceQuery(org, placeQuery);
      return false;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ org }) => org);
}

export async function findOrganizationsForChat(
  query: string,
  limit = 6,
): Promise<Organization[]> {
  const category = detectCategory(query);
  const placeQuery = extractPlaceQuery(query);
  const allOrganizations = await fetchOrganizations();

  const catalogMatches = await searchCatalogByText(
    query,
    allOrganizations,
    category,
    limit,
  );

  if (placeQuery) {
    const coords = await nominatimSearch(placeQuery);
    if (coords) {
      const nearby = await fetchNearbyForCoordinates(coords, category);
      const merged = dedupeOrganizations([...catalogMatches, ...nearby]);
      if (merged.length > 0) return merged.slice(0, limit);
      return nearby.slice(0, limit);
    }
  }

  return catalogMatches;
}

function formatOrganizationLine(org: Organization): string {
  const parts = [
    org.name,
    org.category,
    [org.city, org.country].filter(Boolean).join(", "),
    org.address,
    org.phone ? `tel: ${org.phone}` : "",
    org.website ? `web: ${org.website}` : "",
  ].filter(Boolean);

  return `- ${parts.join(" | ")}`;
}

export function buildChatSystemPrompt(
  organizations: Organization[],
  userQuery: string,
): string {
  const placeQuery = extractPlaceQuery(userQuery);
  const orgBlock =
    organizations.length > 0
      ? organizations.map(formatOrganizationLine).join("\n")
      : "(none matched in database)";

  return `You are the Help Nearby assistant. Answer using ONLY the ORGANIZATIONS list below.

STRICT RULES:
- Reply in the same language as the user.
- Format: 1 short intro line (max 12 words) with the city/area if known, then bullet list (max 5 items).
- Each bullet: **Name** — address, phone/website if available. One line only.
- No greetings like "Hello". No closing phrases. No generic advice. No invented places.
- If ORGANIZATIONS is empty: say no matches for ${placeQuery ?? "that place"} in our database, suggest opening the map on the homepage or Emergency button. Max 2 sentences.

ORGANIZATIONS:
${orgBlock}

USER QUERY: ${userQuery}`;
}
