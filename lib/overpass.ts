import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { formatDistanceMiles } from "@/lib/geo";
import { slugify } from "@/lib/org";
import type { Category, Organization, UserLocation } from "@/lib/types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
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

function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  const around = `(around:${radius},${lat},${lng})`;
  return `
[out:json][timeout:60];
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

function getCoordinates(el: OverpassElement): { lat: number; lng: number } | null {
  if (el.lat != null && el.lon != null) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center?.lat != null && el.center?.lon != null) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
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

function mapElementToOrganization(
  el: OverpassElement,
  userLocation: UserLocation,
): Organization | null {
  const coords = getCoordinates(el);
  const tags = el.tags;
  if (!coords || !tags) return null;

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
    openNow: false,
    verified: false,
  };
}

export async function fetchNearbyOrganizations(
  lat: number,
  lng: number,
  radius = NEARBY_RADIUS_METERS,
): Promise<Organization[]> {
  const userLocation: UserLocation = { lat, lng };
  const query = buildOverpassQuery(lat, lng, radius);

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": OVERPASS_USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const elements = data.elements ?? [];

  const seen = new Set<string>();
  const organizations: Organization[] = [];

  for (const el of elements) {
    const org = mapElementToOrganization(el, userLocation);
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
