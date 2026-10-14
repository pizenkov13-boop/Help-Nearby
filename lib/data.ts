import { CATEGORIES } from "@/lib/categories";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { distanceMiles, formatDistanceMiles } from "@/lib/geo";
import { getSupabase, isSupabaseFetchError } from "@/lib/supabase";
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

/** Postgres `timestamp` (no tz) values are UTC; normalise so clients parse them consistently. */
function toIsoTimestamp(value: string): string {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value.replace(" ", "T")}Z`;
}

function isUsableCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) >= 0.001 &&
    Math.abs(lng) >= 0.001
  );
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
    city: row.city ?? "",
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
    hoursRaw: row.hours ?? "",
    openNow: false,
    verified: Boolean(row.verified),
    ...(row.created_at ? { createdAt: toIsoTimestamp(row.created_at) } : {}),
  };

  // Rows without real coordinates (null or 0,0) get no distance instead of a distance to (0,0).
  if (userLocation && isUsableCoordinate(lat, lng)) {
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
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase.from("organizations").select("*").order("name");

    if (country) {
      query = query.eq("country", country);
    }

    const { data, error } = await query;

    if (error) {
      if (isSupabaseFetchError(error)) {
        console.warn(
          "[fetchOrganizations] Supabase unreachable — using empty catalog",
        );
      } else {
        console.error("[fetchOrganizations]", error.message);
      }
      return [];
    }

    return (data as DbOrganization[]) ?? [];
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchOrganizations] Supabase unreachable — using empty catalog");
    } else {
      console.error("[fetchOrganizations]", error);
    }
    return [];
  }
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
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
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
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchOrganizationBySlug] Supabase unreachable");
    } else {
      console.error("[fetchOrganizationBySlug]", error);
    }
    return null;
  }
}

export async function fetchCountries(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
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
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchCountries] Supabase unreachable — using empty list");
    } else {
      console.error("[fetchCountries]", error);
    }
    return [];
  }
}

export interface ChatCatalogQuery {
  country: string | null;
  city: string | null;
  category: Category | null;
  location: UserLocation | null;
}

/** Verified catalog rows for the AI chat, nearest first when coordinates are known. */
export async function fetchCatalogForChat(
  query: ChatCatalogQuery,
  limit = 30,
): Promise<Organization[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let request = supabase
    .from("organizations")
    .select("*")
    .eq("verified", true)
    .limit(1000);
  if (query.country) request = request.ilike("country", query.country);
  else if (query.city) request = request.ilike("city", `%${query.city}%`);
  if (query.category) request = request.contains("category", [query.category]);

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const orgs = ((data as DbOrganization[]) ?? []).map((row) =>
    mapDbOrganization(row, query.location),
  );
  if (!query.location) return orgs.slice(0, limit);

  const here = query.location;
  return orgs
    .map((org) => ({
      org,
      miles: distanceMiles(here.lat, here.lng, org.lat, org.lng),
    }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit)
    .map(({ org }) => org);
}

export const RECENT_PAGE_SIZE = 30;

export interface FetchRecentOptions {
  offset?: number;
  limit?: number;
  country?: string;
  category?: Category;
}

export interface RecentOrganizationsPage {
  organizations: Organization[];
  hasMore: boolean;
  error: boolean;
}

/** Verified organizations, newest first, paginated with range(). */
export async function fetchRecentOrganizations(
  options: FetchRecentOptions = {},
): Promise<RecentOrganizationsPage> {
  const limit = Math.min(Math.max(options.limit ?? RECENT_PAGE_SIZE, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const supabase = getSupabase();
  if (!supabase) return { organizations: [], hasMore: false, error: false };

  try {
    let query = supabase
      .from("organizations")
      .select("*")
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (options.country) query = query.eq("country", options.country);
    if (options.category) query = query.contains("category", [options.category]);

    // Fetch one extra row to know whether another page exists.
    const { data, error } = await query.range(offset, offset + limit);

    if (error) {
      console.error("[fetchRecentOrganizations]", error.message);
      return { organizations: [], hasMore: false, error: true };
    }

    const rows = (data as DbOrganization[]) ?? [];
    return {
      organizations: rows.slice(0, limit).map((row) => mapDbOrganization(row)),
      hasMore: rows.length > limit,
      error: false,
    };
  } catch (error) {
    if (isSupabaseFetchError(error)) {
      console.warn("[fetchRecentOrganizations] Supabase unreachable");
    } else {
      console.error("[fetchRecentOrganizations]", error);
    }
    return { organizations: [], hasMore: false, error: true };
  }
}

export async function fetchVerifiedCountries(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("country")
      .eq("verified", true)
      .not("country", "is", null);

    if (error) {
      console.error("[fetchVerifiedCountries]", error.message);
      return [];
    }

    return Array.from(
      new Set(
        (data as { country: string }[]).map((row) => row.country).filter(Boolean),
      ),
    ).sort();
  } catch (error) {
    if (!isSupabaseFetchError(error)) console.error("[fetchVerifiedCountries]", error);
    return [];
  }
}

/** @deprecated Use fetchCountries() */
export const countries: string[] = [];
