import { CATEGORIES } from "@/lib/categories";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import type { Category, Organization, UserLocation, WeeklyHours } from "./types";

export interface DbOrganization {
  id: number;
  name: string;
  slug: string;
  category: string[];
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  rating: number | null;
  verified: boolean | null;
  created_at: string | null;
}

export interface FetchOrganizationsOptions {
  country?: string;
  radiusMeters?: number;
}

function toCategory(value: string): Category | null {
  const normalized = value.toLowerCase() as Category;
  return CATEGORIES.includes(normalized) ? normalized : null;
}

function parseCategories(raw: string[] | null | undefined): Category[] {
  if (!raw?.length) return ["food"];
  const mapped = raw
    .map((c) => toCategory(c))
    .filter((c): c is Category => c !== null);
  return mapped.length > 0 ? mapped : ["food"];
}

function parseHours(hours: string | null | undefined): WeeklyHours {
  if (!hours) return {};
  try {
    return JSON.parse(hours) as WeeklyHours;
  } catch {
    return {};
  }
}

export function mapDbOrganization(
  row: DbOrganization,
  userLocation?: UserLocation | null,
): Organization {
  const categories = parseCategories(row.category);
  const lat = Number(row.lat ?? 0);
  const lng = Number(row.lng ?? 0);
  const hours = parseHours(row.hours);

  const org: Organization = {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    category: categories[0],
    categories,
    country: row.country ?? "",
    lat,
    lng,
    distance: "",
    rating: Number(row.rating ?? 0),
    address: row.address ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    description: row.description ?? "",
    hours,
    openNow: false,
    verified: Boolean(row.verified),
  };

  if (userLocation) {
    org.distance = formatDistanceMiles(
      userLocation.lat,
      userLocation.lng,
      lat,
      lng,
    );
  }

  return org;
}

function filterByRadius(
  orgs: Organization[],
  userLocation: UserLocation,
  radiusMeters: number,
): Organization[] {
  const radiusMiles = radiusMeters / 1609.34;
  return orgs.filter(
    (org) =>
      distanceMiles(userLocation.lat, userLocation.lng, org.lat, org.lng) <=
      radiusMiles,
  );
}

async function queryOrganizations(country?: string): Promise<DbOrganization[]> {
  let query = supabase.from("organizations").select("*").order("name");

  if (country) {
    query = query.eq("country", country);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[fetchOrganizations]", error.message);
    return [];
  }

  return (data as DbOrganization[]) ?? [];
}

export async function fetchOrganizations(
  userLocation?: UserLocation | null,
  options?: FetchOrganizationsOptions,
): Promise<Organization[]> {
  const radiusMeters = options?.radiusMeters ?? NEARBY_RADIUS_METERS;

  let rows = await queryOrganizations(options?.country);

  if (rows.length === 0 && options?.country) {
    rows = await queryOrganizations();
  }

  let orgs = rows.map((row) => mapDbOrganization(row, userLocation));

  if (userLocation && options?.radiusMeters !== undefined) {
    orgs = filterByRadius(orgs, userLocation, radiusMeters);
  }

  return orgs;
}

export async function fetchOrganizationBySlug(
  slug: string,
  userLocation?: UserLocation | null,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[fetchOrganizationBySlug]", error.message);
    return null;
  }

  if (!data) return null;

  return mapDbOrganization(data as DbOrganization, userLocation);
}

export async function fetchCountries(): Promise<string[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select("country")
    .not("country", "is", null);

  if (error) {
    console.error("[fetchCountries]", error.message);
    return [];
  }

  return Array.from(
    new Set(
      (data as { country: string }[])
        .map((row) => row.country)
        .filter(Boolean),
    ),
  ).sort();
}

/** @deprecated Use fetchCountries() */
export const countries: string[] = [];
