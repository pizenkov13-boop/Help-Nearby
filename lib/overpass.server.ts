import "server-only";

import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { formatDistanceMiles } from "@/lib/geo";
import {
  buildOverpassCacheKey,
  OVERPASS_CACHE_TTL_MS,
  OVERPASS_TIMEOUT_MS,
} from "@/lib/overpassCache";
import {
  buildEmergencyMetadataRaw,
  isGenuineEmergencyOsmFacility,
} from "@/lib/emergencyFacilities";
import { slugify } from "@/lib/orgUtils";
import {
  normalizeRawCoordinates,
} from "@/lib/organizationCoordinates";
import type { Category, Organization, UserLocation } from "@/lib/types";

/**
 * Fallback chain, tried in this order. overpass-api.de is often overloaded and kumi /
 * private.coffee may be unreachable from some hosts, so openstreetmap.fr sits second.
 */
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

/** A further mirror is started this long after the previous one (or as soon as it fails). */
const OVERPASS_HEDGE_DELAY_MS = 2000;

const OVERPASS_USER_AGENT = "HelpNearby/1.0 (help-nearby.app)";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface CacheEntry {
  expiresAt: number;
  organizations: Organization[];
}

const serverCache = new Map<string, CacheEntry>();

function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  const around = `(around:${radius},${lat},${lng})`;
  return `
[out:json][timeout:25];
(
  nwr["amenity"="food_bank"]${around};
  nwr["amenity"="shelter"]${around};
  nwr["amenity"="clinic"]${around};
  nwr["amenity"="hospital"]${around};
  nwr["amenity"="pharmacy"]${around};
  nwr["social_facility"="food_bank"]${around};
  nwr["social_facility"="shelter"]${around};
  nwr["charity"="yes"]${around};
);
out center tags;
`.trim();
}

/** Broader humanitarian search for AI chat (soup kitchens, charity shops, etc.). */
export function buildChatOverpassQuery(
  lat: number,
  lng: number,
  radius: number,
): string {
  const around = `(around:${radius},${lat},${lng})`;
  return `
[out:json][timeout:25];
(
  nwr["amenity"="food_bank"]${around};
  nwr["amenity"="shelter"]${around};
  nwr["amenity"="clinic"]${around};
  nwr["amenity"="hospital"]${around};
  nwr["amenity"="pharmacy"]${around};
  nwr["amenity"="social_facility"]${around};
  nwr["social_facility"="food_bank"]${around};
  nwr["social_facility"="shelter"]${around};
  nwr["social_facility"="soup_kitchen"]${around};
  nwr["social_facility"="nutrition_center"]${around};
  nwr["social_facility:for"="food"]${around};
  nwr["shop"="charity"]${around};
  nwr["charity"="yes"]${around};
  nwr["amenity"="give_box"]${around};
  nwr["amenity"="community_centre"]["community_centre:for"="social_facility"]${around};
);
out center tags;
`.trim();
}

const CHAT_CATEGORY_SELECTORS: Record<Category, string[]> = {
  food: [
    '["amenity"="food_bank"]',
    '["social_facility"="food_bank"]',
    '["social_facility"="soup_kitchen"]',
    '["social_facility"="nutrition_center"]',
    '["social_facility:for"="food"]',
    '["amenity"="give_box"]',
  ],
  shelter: ['["amenity"="shelter"]', '["social_facility"="shelter"]'],
  // Pharmacies are only searched for the medical category.
  medical: [
    '["amenity"="clinic"]',
    '["amenity"="hospital"]',
    '["amenity"="pharmacy"]',
  ],
  clothing: ['["social_facility"="clothing_bank"]', '["amenity"="give_box"]'],
  volunteer: [
    '["charity"="yes"]',
    '["amenity"="community_centre"]["community_centre:for"="social_facility"]',
  ],
};

function buildChatCategoryQuery(category: Category) {
  return (lat: number, lng: number, radius: number): string => {
    const around = `(around:${radius},${lat},${lng})`;
    const lines = CHAT_CATEGORY_SELECTORS[category].map(
      (selector) => `  nwr${selector}${around};`,
    );
    return ["[out:json][timeout:25];", "(", ...lines, ");", "out center tags;"].join(
      "\n",
    );
  };
}

/** AI chat search restricted to one category (no pharmacies/shops unless medical). */
export async function fetchChatOverpassForCategory(
  lat: number,
  lng: number,
  radius: number,
  category: Category,
): Promise<Organization[]> {
  const userLocation: UserLocation = { lat, lng };
  const cacheKey = `${buildOverpassCacheKey(lat, lng, radius)}:chat:${category}`;
  const cached = readServerCache(cacheKey);
  if (cached) return cached;

  const data = await queryOverpass(buildChatCategoryQuery(category)(lat, lng, radius));
  const organizations = parseOverpassElements(data, userLocation, radius);
  writeServerCache(cacheKey, organizations);
  return organizations;
}

export function buildEmergencyOverpassQuery(
  lat: number,
  lng: number,
  radius: number,
): string {
  const around = `(around:${radius},${lat},${lng})`;
  return `
[out:json][timeout:25];
(
  nwr["emergency"="ambulance_station"]${around};
  nwr["emergency"="emergency_ward"]${around};
  nwr["amenity"="hospital"]["emergency"~"^(yes|emergency_ward|department)$"]${around};
  nwr["amenity"="hospital"]["healthcare"="emergency"]${around};
  nwr["healthcare"="emergency"]${around};
  nwr["healthcare"="urgent_care"]${around};
  nwr["amenity"="clinic"]["emergency"~"^(yes|emergency_ward)$"]${around};
  nwr["amenity"="clinic"]["healthcare"="urgent_care"]${around};
  nwr["amenity"="hospital"]${around};
  nwr["amenity"="pharmacy"]${around};
  nwr["amenity"="fire_station"]${around};
  nwr["amenity"="police"]${around};
);
out center tags;
`.trim();
}

/**
 * Hedged mirror chain: the first mirror starts immediately, the next one starts after
 * OVERPASS_HEDGE_DELAY_MS (or right away when the previous one fails). The first
 * successful response wins and the rest are aborted; everything stops at the deadline.
 */
async function queryOverpass(query: string): Promise<OverpassResponse> {
  const deadline = Date.now() + OVERPASS_TIMEOUT_MS;
  const controllers: AbortController[] = [];
  const errors: string[] = [];

  const attempt = async (url: string): Promise<OverpassResponse> => {
    const controller = new AbortController();
    controllers.push(controller);
    const timer = setTimeout(
      () => controller.abort(),
      Math.max(deadline - Date.now(), 1),
    );
    try {
      console.log(`[overpass] Trying ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": OVERPASS_USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${new URL(url).host}`);
      }
      const data = (await response.json()) as OverpassResponse;
      console.log(
        `[overpass] Success from ${url} (${data.elements?.length ?? 0} elements)`,
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${new URL(url).host}: ${message}`);
      console.error(`[overpass] Failed ${url}:`, message);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  return new Promise<OverpassResponse>((resolve, reject) => {
    let started = 0;
    let failed = 0;
    let settled = false;
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (hedgeTimer) clearTimeout(hedgeTimer);
      controllers.forEach((controller) => controller.abort());
      fn();
    };

    const startNext = () => {
      if (settled || started >= OVERPASS_URLS.length) return;
      if (deadline - Date.now() <= 300) return;
      const url = OVERPASS_URLS[started++]!;
      attempt(url).then(
        (data) => finish(() => resolve(data)),
        () => {
          failed += 1;
          if (settled) return;
          if (failed >= OVERPASS_URLS.length || (started >= OVERPASS_URLS.length && failed >= started)) {
            finish(() => reject(new Error(`All Overpass mirrors failed: ${errors.join("; ")}`)));
            return;
          }
          startNext(); // previous attempt failed: do not wait for the hedge delay
        },
      );
      if (started < OVERPASS_URLS.length) {
        hedgeTimer = setTimeout(startNext, OVERPASS_HEDGE_DELAY_MS);
      }
    };

    startNext();
    setTimeout(
      () => finish(() => reject(new Error(`Overpass timeout: ${errors.join("; ") || "no response"}`))),
      Math.max(deadline - Date.now(), 1),
    );
  });
}

function getElementGeometryCoordinates(
  el: OverpassElement,
): { lat: number; lng: number } | null {
  // Nodes: use node position. Ways/relations: prefer `out center` geometry.
  if (el.type === "node") {
    if (el.lat != null && el.lon != null) {
      return { lat: el.lat, lng: el.lon };
    }
    return null;
  }

  if (el.center?.lat != null && el.center?.lon != null) {
    return { lat: el.center.lat, lng: el.center.lon };
  }

  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon };
  }

  return null;
}

function getTagAddressCoordinates(
  tags: Record<string, string>,
): { lat: number; lng: number } | null {
  const lat = Number(tags["addr:lat"]);
  const lng = Number(tags["addr:lon"]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function resolveOverpassCoordinates(
  el: OverpassElement,
  tags: Record<string, string>,
  userLocation: UserLocation,
  maxRadiusMeters: number,
): { lat: number; lng: number } | null {
  const geometry = getElementGeometryCoordinates(el);
  const tagCoords = getTagAddressCoordinates(tags);

  const candidates: { lat: number; lng: number }[] = [];
  if (geometry) candidates.push(geometry);
  if (tagCoords) candidates.push(tagCoords);

  if (candidates.length === 0) return null;

  // Prefer candidate within radius; if both valid, prefer tag address when geometry is far off
  let best: { lat: number; lng: number } | null = null;
  let bestDist = Infinity;

  for (const candidate of candidates) {
    const normalized = normalizeRawCoordinates(
      candidate.lat,
      candidate.lng,
      userLocation,
      maxRadiusMeters,
    );
    if (!normalized) continue;

    const dist = Math.hypot(
      normalized.lat - userLocation.lat,
      normalized.lng - userLocation.lng,
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = normalized;
    }
  }

  return best;
}

function mapTagsToCategory(tags: Record<string, string>): Category {
  const amenity = tags.amenity?.toLowerCase();
  const social = tags.social_facility?.toLowerCase();

  if (
    amenity === "food_bank" ||
    social === "food_bank" ||
    social === "soup_kitchen" ||
    social === "nutrition_center" ||
    tags["social_facility:for"] === "food" ||
    amenity === "give_box"
  ) {
    return "food";
  }
  if (amenity === "shelter" || social === "shelter") {
    return "shelter";
  }
  if (
    amenity === "clinic" ||
    amenity === "hospital" ||
    amenity === "pharmacy" ||
    tags.healthcare
  ) {
    return "medical";
  }
  if (tags.shop === "charity" || tags.charity === "yes") {
    return "volunteer";
  }
  if (tags.clothes === "yes" || tags["second_hand"] === "yes") {
    return "clothing";
  }
  return "volunteer";
}

function buildAddress(tags: Record<string, string>): string {
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:state"],
    tags["addr:postcode"],
    tags["addr:country"],
  ].filter(Boolean);
  return parts.join(", ");
}

function buildHoursRaw(tags: Record<string, string>): string {
  return tags.opening_hours?.trim() ?? "";
}

function mapElementToOrganization(
  el: OverpassElement,
  userLocation: UserLocation,
  maxRadiusMeters: number,
  options?: { emergency?: boolean },
): Organization | null {
  const tags = el.tags;
  if (!tags) return null;

  if (options?.emergency && !isGenuineEmergencyOsmFacility(tags)) {
    return null;
  }

  const coords = resolveOverpassCoordinates(
    el,
    tags,
    userLocation,
    maxRadiusMeters,
  );
  if (!coords) return null;

  const name =
    tags.name ??
    tags.brand ??
    tags.operator ??
    tags["addr:housename"] ??
    null;
  if (!name) return null;

  const category = mapTagsToCategory(tags);
  const slug = `osm-${el.type}-${el.id}-${slugify(name)}`;

  return {
    id: `overpass-${el.type}-${el.id}`,
    slug,
    name,
    category,
    categories: [category],
    country: tags["addr:country"] ?? "",
    city:
      tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? "",
    lat: coords.lat,
    lng: coords.lng,
    distance: formatDistanceMiles(
      userLocation.lat,
      userLocation.lng,
      coords.lat,
      coords.lng,
    ),
    rating: 0,
    address: buildAddress(tags),
    phone: tags.phone ?? tags["contact:phone"] ?? "",
    email: tags.email ?? tags["contact:email"] ?? "",
    website: tags.website ?? tags["contact:website"] ?? "",
    description:
      tags.description ??
      tags.operator ??
      [tags.amenity, tags.social_facility].filter(Boolean).join(" · "),
    hours: {},
    hoursRaw: options?.emergency
      ? buildEmergencyMetadataRaw(tags)
      : buildHoursRaw(tags),
    openNow: false,
    verified: false,
  };
}

function parseOverpassElements(
  data: OverpassResponse,
  userLocation: UserLocation,
  maxRadiusMeters: number,
  options?: { emergency?: boolean },
): Organization[] {
  const elements = data.elements ?? [];
  const seen = new Set<string>();
  const organizations: Organization[] = [];

  for (const el of elements) {
    const org = mapElementToOrganization(
      el,
      userLocation,
      maxRadiusMeters,
      options,
    );
    if (!org) continue;
    const key = `${org.lat.toFixed(5)}:${org.lng.toFixed(5)}:${org.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    organizations.push(org);
  }

  return organizations.sort((a, b) => {
    const distA = parseFloat(a.distance) || 999;
    const distB = parseFloat(b.distance) || 999;
    return distA - distB;
  });
}

function readServerCache(key: string): Organization[] | null {
  const entry = serverCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    serverCache.delete(key);
    return null;
  }
  return entry.organizations;
}

function writeServerCache(key: string, organizations: Organization[]): void {
  serverCache.set(key, {
    organizations,
    expiresAt: Date.now() + OVERPASS_CACHE_TTL_MS,
  });
}

async function fetchOverpassOrganizations(
  lat: number,
  lng: number,
  radius: number,
  buildQuery: (lat: number, lng: number, radius: number) => string,
  options?: { emergency?: boolean },
): Promise<Organization[]> {
  const userLocation: UserLocation = { lat, lng };
  const cacheKey =
    buildOverpassCacheKey(lat, lng, radius) +
    (options?.emergency ? ":emergency" : ":nearby");
  const cached = readServerCache(cacheKey);
  if (cached) {
    console.log(`[overpass] Cache hit (${cached.length} orgs)`);
    return cached;
  }

  const query = buildQuery(lat, lng, radius);
  const data = await queryOverpass(query);
  const organizations = parseOverpassElements(
    data,
    userLocation,
    radius,
    options,
  );
  writeServerCache(cacheKey, organizations);
  return organizations;
}

export async function fetchNearbyOverpassOrganizations(
  lat: number,
  lng: number,
  radius = NEARBY_RADIUS_METERS,
): Promise<Organization[]> {
  return fetchOverpassOrganizations(lat, lng, radius, buildOverpassQuery);
}

export async function fetchChatOverpassOrganizations(
  lat: number,
  lng: number,
  radius: number,
): Promise<Organization[]> {
  return fetchOverpassOrganizations(
    lat,
    lng,
    radius,
    buildChatOverpassQuery,
  );
}

export async function fetchEmergencyOverpassOrganizations(
  lat: number,
  lng: number,
  radius = NEARBY_RADIUS_METERS,
): Promise<Organization[]> {
  return fetchOverpassOrganizations(
    lat,
    lng,
    radius,
    buildEmergencyOverpassQuery,
    { emergency: true },
  );
}

/** Diagnostics: one tiny query per mirror (host, status or error type, duration). No bodies. */
export async function probeOverpassMirrors(): Promise<
  { host: string; ok: boolean; status: number | string; ms: number }[]
> {
  const results: { host: string; ok: boolean; status: number | string; ms: number }[] = [];
  for (const url of OVERPASS_URLS) {
    const started = Date.now();
    const host = new URL(url).host;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": OVERPASS_USER_AGENT,
        },
        body: `data=${encodeURIComponent("[out:json][timeout:5];node(1);out;")}`,
        signal: AbortSignal.timeout(4000),
      });
      results.push({ host, ok: response.ok, status: response.status, ms: Date.now() - started });
    } catch (error) {
      results.push({
        host,
        ok: false,
        status: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network error",
        ms: Date.now() - started,
      });
    }
  }
  return results;
}
