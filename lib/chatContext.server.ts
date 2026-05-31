import "server-only";

import { fetchOrganizations } from "@/lib/data";
import { mergeOrganizations } from "@/lib/mergeOrganizations";
import { resolvePlaceCoordinates } from "@/lib/nominatim.server";
import { fetchChatOverpassOrganizations } from "@/lib/overpass.server";
import {
  RADIUS_TIERS_STANDARD,
  runSmartRadiusSearch,
} from "@/lib/smartRadius";
import type { Category, Organization, UserLocation } from "@/lib/types";

export interface SearchIntent {
  category: Category | null;
  place: string | null;
}

const CATEGORY_LABELS: Record<Category, string> = {
  food: "еда",
  shelter: "приют",
  medical: "медицина",
  clothing: "одежда",
  volunteer: "волонтеры",
};

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
    "покушать",
    "поесть",
    "кушать",
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

const FOOD_PHRASE_WORDS = new Set([
  "покушать",
  "поесть",
  "кушать",
  "пообедать",
  "позавтракать",
  "перекусить",
]);

const ALL_CATEGORY_KEYWORDS = new Set(
  Object.values(CATEGORY_KEYWORDS).flat().map((word) => word.toLowerCase()),
);

/** Too short / broken fragments after bad keyword stripping (e.g. «ать» from «покушать»). */
const INVALID_PLACE_TOKENS = new Set(["ать", "ест", "еду", "edi"]);

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
  return normalizedQuery
    .split(" ")
    .filter((token) => {
      if (!token) return false;
      if (FOOD_PHRASE_WORDS.has(token)) return false;
      if (ALL_CATEGORY_KEYWORDS.has(token)) return false;
      for (const keyword of ALL_CATEGORY_KEYWORDS) {
        if (keyword.length >= 3 && token.includes(keyword) && token.length <= keyword.length + 2) {
          return false;
        }
      }
      return true;
    })
    .join(" ");
}

function isValidPlaceQuery(place: string): boolean {
  const tokens = place.split(" ").filter(Boolean);
  if (tokens.length === 0) return false;

  for (const token of tokens) {
    if (token.length < 4) return false;
    if (INVALID_PLACE_TOKENS.has(token)) return false;
    if (ALL_CATEGORY_KEYWORDS.has(token)) return false;
    if (STOP_WORDS.has(token)) return false;
  }

  return true;
}

function tokensMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const prefixLength = Math.min(a.length, b.length, 6);
  return a.slice(0, prefixLength) === b.slice(0, prefixLength);
}

function removeStopWords(text: string): string {
  return text
    .split(" ")
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
    .join(" ");
}

/** City/country phrase from any language, e.g. "прокопьевске", "new york", "berlin". */
export function extractPlaceQuery(query: string): string | null {
  const normalized = normalizeText(query);
  const place = removeStopWords(stripCategoryWords(normalized))
    .replace(/\s+/g, " ")
    .trim();

  if (!isValidPlaceQuery(place)) return null;
  return place;
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
  const fetchAtRadius = async (radiusMeters: number) => {
    const [catalog, overpass] = await Promise.all([
      fetchOrganizations(location, { radiusMeters }),
      fetchChatOverpassOrganizations(location.lat, location.lng, radiusMeters),
    ]);
    const merged = mergeOrganizations(catalog, overpass);
    const filtered = filterByCategory(merged, category);
    if (category) return filtered;
    return merged;
  };

  const result = await runSmartRadiusSearch(fetchAtRadius, {
    liteMode: false,
    autoExpand: true,
  });

  return result.organizations.slice(0, 8);
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
  intent?: SearchIntent,
): Promise<Organization[]> {
  const category = intent?.category ?? detectCategory(query);
  const placeQuery = intent?.place ?? extractPlaceQuery(query);

  if (category && !placeQuery) {
    return [];
  }

  const allOrganizations = await fetchOrganizations();

  const catalogMatches = placeQuery
    ? await searchCatalogByText(query, allOrganizations, category, limit)
    : [];

  if (placeQuery) {
    const coords = await resolvePlaceCoordinates(placeQuery);
    if (coords) {
      const nearby = await fetchNearbyForCoordinates(coords, category);
      const merged = dedupeOrganizations([...catalogMatches, ...nearby]);
      if (merged.length > 0) return merged.slice(0, limit);
    }
  }

  return catalogMatches;
}

export function formatChatReply(
  organizations: Organization[],
  userQuery: string,
  intent?: SearchIntent,
): string {
  const placeQuery = intent?.place ?? extractPlaceQuery(userQuery);
  const category = intent?.category ?? detectCategory(userQuery);
  const isRussian = /[\u0400-\u04FF]/.test(userQuery);

  if (organizations.length === 0) {
    if (isRussian) {
      if (category && !placeQuery) {
        return "Укажите город, например: «где поесть в Прокопьевске» или «хочу есть в Москве».";
      }
      return placeQuery
        ? `В ${placeQuery} в базе пока ничего не найдено. Откройте карту на главной или нажмите «Экстренная помощь».`
        : "Напишите город и тип помощи (еда, приют, медицина). Или откройте карту на главной.";
    }
    if (category && !placeQuery) {
      return "Include a city, e.g. «food in Moscow» or «where to eat in Berlin».";
    }
    return placeQuery
      ? `No locations found for ${placeQuery}. Open the map on the homepage or tap Emergency Help.`
      : "Include a city and type of help (food, shelter, medical). Or use the map on the homepage.";
  }

  const header = isRussian
    ? `Помощь${placeQuery ? ` — ${placeQuery}` : ""}:`
    : `Help nearby${placeQuery ? ` — ${placeQuery}` : ""}:`;

  const lines = organizations.slice(0, 5).map((org) => {
    const details = [org.address, org.phone, org.website].filter(Boolean).join(", ");
    return details ? `• ${org.name} — ${details}` : `• ${org.name}`;
  });

  return [header, ...lines].join("\n");
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function isHelpSearchQuery(query: string): boolean {
  return Boolean(extractPlaceQuery(query) || detectCategory(query));
}

/** First search with a city → list from DB. Follow-ups → Groq. New city → list again. */
export function shouldUseDirectSearch(
  messages: ChatTurn[],
  currentQuery: string,
): boolean {
  const hasPriorAssistant = messages.some(
    (message, index) =>
      message.role === "assistant" && index < messages.length - 1,
  );

  if (extractPlaceQuery(currentQuery)) return true;
  if (!hasPriorAssistant) return true;
  return false;
}

export function buildContextSearchQuery(
  priorMessages: ChatTurn[],
  currentQuery: string,
): string {
  const priorUserQueries = priorMessages
    .filter((message) => message.role === "user")
    .map((message) => message.content);

  const lastSearch = [...priorUserQueries].reverse().find(isHelpSearchQuery);
  if (!lastSearch) return currentQuery;

  const place =
    extractPlaceQuery(lastSearch) ?? extractPlaceQuery(currentQuery);
  const category =
    detectCategory(currentQuery) ?? detectCategory(lastSearch);

  const parts: string[] = [];
  if (category) parts.push(CATEGORY_LABELS[category]);
  if (place) parts.push(place);

  return parts.length > 0 ? parts.join(" ") : lastSearch;
}

function formatOrganizationsForPrompt(organizations: Organization[]): string {
  if (organizations.length === 0) return "(none in database)";

  return organizations
    .slice(0, 8)
    .map((org, index) => {
      const parts = [
        `${index + 1}. ${org.name}`,
        org.category,
        [org.city, org.country].filter(Boolean).join(", "),
        org.address,
        org.phone ? `tel: ${org.phone}` : "",
        org.website ? `web: ${org.website}` : "",
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");
}

export function buildFollowUpSystemPrompt(
  organizations: Organization[],
  contextQuery: string,
): string {
  return `You are the Help Nearby assistant. The user already saw nearby help locations. Answer their follow-up using ONLY ORGANIZATIONS below.

RULES:
- Reply in the same language as the user.
- Max 3 short sentences OR up to 4 bullet points.
- No greetings, no filler, no invented addresses or phone numbers.
- If the data does not contain the answer, say so in one sentence and suggest the homepage map.

SEARCH CONTEXT: ${contextQuery}

ORGANIZATIONS:
${formatOrganizationsForPrompt(organizations)}`;
}

export function formatFollowUpFallback(
  userQuery: string,
  organizations: Organization[],
): string {
  const isRussian = /[\u0400-\u04FF]/.test(userQuery);

  if (detectCategory(userQuery) && organizations.length > 0) {
    return formatChatReply(organizations, userQuery);
  }

  return isRussian
    ? "Смотрите список выше. Для нового поиска напишите город и тип помощи."
    : "See the list above. For a new search, include a city and type of help.";
}
