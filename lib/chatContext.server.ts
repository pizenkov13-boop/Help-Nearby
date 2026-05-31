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
  "а",
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

  const meaningful = tokens.filter(
    (token) =>
      !STOP_WORDS.has(token) &&
      !ALL_CATEGORY_KEYWORDS.has(token) &&
      !INVALID_PLACE_TOKENS.has(token),
  );

  if (meaningful.length === 0) return false;

  if (meaningful.length === 1) {
    return meaningful[0]!.length >= 3;
  }

  return meaningful.join(" ").length >= 4;
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

function filterByCategory(
  organizations: Organization[],
  category: Category | null,
): Organization[] {
  if (!category) return organizations;
  return organizations.filter((org) => org.categories.includes(category));
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

  if (!placeQuery) {
    return [];
  }

  const coords = await resolvePlaceCoordinates(placeQuery);
  if (!coords) {
    return [];
  }

  return (await fetchNearbyForCoordinates(coords, category)).slice(0, limit);
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
        ? `В ${placeQuery} ничего не найдено (Supabase + OpenStreetMap). Откройте карту на главной или «Экстренная помощь».`
        : "Напишите город и тип помощи (еда, приют, медицина). Или откройте карту на главной.";
    }
    if (category && !placeQuery) {
      return "Include a city, e.g. «food in Moscow» or «where to eat in Berlin».";
    }
    return placeQuery
      ? `No locations found for ${placeQuery} (Supabase + OpenStreetMap). Open the map on the homepage or tap Emergency Help.`
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

/** Database list when user asks for help or names a place; Groq only for detail questions. */
export function shouldUseDirectSearch(
  messages: ChatTurn[],
  currentQuery: string,
  intent: SearchIntent,
): boolean {
  if (intent.place || intent.category) return true;

  const lastAssistant = [...messages]
    .slice(0, -1)
    .reverse()
    .find((message) => message.role === "assistant");

  if (!lastAssistant) return true;

  const showedOrgList =
    lastAssistant.content.includes("•") ||
    lastAssistant.content.startsWith("Помощь") ||
    lastAssistant.content.startsWith("Help nearby");

  return !showedOrgList;
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
