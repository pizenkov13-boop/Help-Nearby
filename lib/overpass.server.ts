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

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
] as const;

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

async function queryOverpass(query: string): Promise<OverpassResponse> {
  let lastError: unknown;

  for (const url of OVERPASS_URLS) {
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
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `HTTP ${response.status} from ${url}: ${body.slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as OverpassResponse;
      console.log(
        `[overpass] Success from ${url} (${data.elements?.length ?? 0} elements)`,
      );
      return data;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[overpass] Failed ${url}:`, message);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Overpass endpoints failed");
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
    tags["social_facility:for"] === "food"
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
