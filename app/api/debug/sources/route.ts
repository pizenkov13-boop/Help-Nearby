import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { NEARBY_RADIUS_METERS } from "@/lib/constants";
import { fetchOrganizations } from "@/lib/data";
import { fetchGdhoOrganizationsForCountry } from "@/lib/gdho";
import { fetchHdxOrganizationsForCountry } from "@/lib/hdx";
import { nominatimReverse, nominatimSearch } from "@/lib/nominatim.server";
import {
  fetchNearbyOverpassOrganizations,
  probeOverpassMirrors,
} from "@/lib/overpass.server";
import { fetchReliefWebOrganizationsForCountry } from "@/lib/reliefweb";
import { getMaxRadiusMeters, getRadiusTiers } from "@/lib/smartRadius";
import { distanceMiles } from "@/lib/geo";
import { withTimeout } from "@/lib/ttlCache";
import type { Organization } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Same budgets as production (see lib/nearbySearch.ts and the API routes). */
const TIMEOUTS = { supabase: 4000, overpass: 9000, ocha: 6000, geocode: 4000 };

interface Probe {
  ok: boolean;
  /** HTTP status, "timeout" or an error type — never a response body. */
  status: number | string;
  ms: number;
  count: number;
  names: string[];
  /** Sanitised warnings/errors the source logged while running (query strings removed). */
  logs?: string[];
  extra?: Record<string, number | string>;
}

function tokenMatches(provided: string | null): boolean {
  const expected = process.env.DEBUG_TOKEN?.trim();
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sanitizeLog(args: unknown[]): string {
  return args
    .map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}` : String(arg)))
    .join(" ")
    .replace(/\?[^\s"')]*/g, "?…")
    .slice(0, 180);
}

function errorStatus(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const http = message.match(/HTTP (\d{3})/);
  if (http) return Number(http[1]) as unknown as string;
  if (/timeout|abort/i.test(message) || (error instanceof Error && error.name === "TimeoutError")) {
    return "timeout";
  }
  return error instanceof Error ? error.name : "error";
}

/** Runs one source on its own, capturing timing, result size and what it logged. */
async function probe(
  run: () => Promise<{ items: { name: string }[]; extra?: Probe["extra"] } | number>,
  timeoutMs: number,
): Promise<Probe> {
  const logs: string[] = [];
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = (...args: unknown[]) => void logs.push(sanitizeLog(args));
  console.error = (...args: unknown[]) => void logs.push(sanitizeLog(args));

  const started = Date.now();
  const TIMED_OUT = Symbol("timeout");
  try {
    const result = await withTimeout<
      Awaited<ReturnType<typeof run>> | typeof TIMED_OUT
    >(run(), timeoutMs, TIMED_OUT);
    const ms = Date.now() - started;
    if (result === TIMED_OUT) {
      return { ok: false, status: "timeout", ms, count: 0, names: [], logs: logs.slice(0, 3) };
    }
    if (typeof result === "number") {
      return { ok: true, status: 200, ms, count: result, names: [], logs: logs.slice(0, 3) };
    }
    return {
      ok: true,
      status: 200,
      ms,
      count: result.items.length,
      names: result.items.slice(0, 2).map((item) => item.name),
      logs: logs.slice(0, 3),
      extra: result.extra,
    };
  } catch (error) {
    return {
      ok: false,
      status: errorStatus(error),
      ms: Date.now() - started,
      count: 0,
      names: [],
      logs: logs.slice(0, 3),
    };
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
}

const named = (orgs: Organization[]) => orgs.map((org) => ({ name: org.name }));

/**
 * TEMPORARY diagnostics: calls every search source separately.
 * Disabled (404) unless DEBUG_TOKEN is set and matches ?token=.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!tokenMatches(searchParams.get("token"))) {
    return new NextResponse(null, { status: 404 });
  }

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const country = searchParams.get("country")?.trim() ?? "";
  const countryCode = searchParams.get("countryCode")?.trim() || null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const radius = getMaxRadiusMeters(false) || NEARBY_RADIUS_METERS;
  const radiusMiles = radius / 1609.34;

  // Sequential on purpose: each probe's timing and captured logs belong to one source only.
  const sources = {
    supabase: await probe(async () => {
      const rows = await fetchOrganizations(null, country ? { country } : undefined);
      const within = rows.filter(
        (org) => distanceMiles(lat, lng, org.lat, org.lng) <= radiusMiles,
      );
      return {
        items: rows,
        extra: {
          rows_returned: rows.length,
          rows_in_country: rows.filter(
            (org) => org.country.toLowerCase() === country.toLowerCase(),
          ).length,
          within_radius_km: Math.round(radius / 1000),
          rows_within_radius: within.length,
        },
      };
    }, TIMEOUTS.supabase),

    // The client asks for the first (smallest) radius tier first, then wider ones on demand.
    overpass_first_tier: await probe(async () => {
      const first = getRadiusTiers(false)[0]!;
      const orgs = await fetchNearbyOverpassOrganizations(lat, lng, first);
      return { items: named(orgs), extra: { radius_km: Math.round(first / 1000) } };
    }, TIMEOUTS.overpass),

    overpass_nearby_all_categories: await probe(async () => {
      const orgs = await fetchNearbyOverpassOrganizations(lat, lng, radius);
      return { items: named(orgs), extra: { radius_km: Math.round(radius / 1000) } };
    }, TIMEOUTS.overpass),

    hdx: await probe(
      async () => ({ items: named(await fetchHdxOrganizationsForCountry(country, countryCode)) }),
      TIMEOUTS.ocha,
    ),
    gdho: await probe(
      async () => ({ items: named(await fetchGdhoOrganizationsForCountry(country)) }),
      TIMEOUTS.ocha,
    ),
    reliefweb: await probe(
      async () => ({
        items: named(await fetchReliefWebOrganizationsForCountry(country, countryCode)),
      }),
      TIMEOUTS.ocha,
    ),

    geocode_reverse: await probe(async () => {
      const result = await nominatimReverse(lat, lng);
      return {
        items: result ? [{ name: result.country }] : [],
        extra: { country_code: result?.countryCode ?? "" },
      };
    }, TIMEOUTS.geocode),
    geocode_forward_country: await probe(async () => {
      const result = country ? await nominatimSearch(country) : null;
      return {
        items: result ? [{ name: `${result.lat.toFixed(3)},${result.lng.toFixed(3)}` }] : [],
      };
    }, TIMEOUTS.geocode),
  };

  const overpass_mirrors = await probeOverpassMirrors();

  return NextResponse.json(
    { query: { lat, lng, country, countryCode, radius_m: radius }, sources, overpass_mirrors },
    { headers: { "Cache-Control": "no-store" } },
  );
}
