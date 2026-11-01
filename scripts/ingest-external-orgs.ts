/**
 * Daily job (GitHub Actions, see .github/workflows/external-orgs.yml): downloads the HDX, GDHO and
 * ReliefWeb organization catalogs per country and stores them in the Supabase table external_orgs,
 * so the website never has to call those slow sources from Vercel.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, RELIEFWEB_APPNAME (optional).
 * Optional: INGEST_COUNTRIES="KE,UG" (ISO codes; default: scripts/external-countries.json), DRY_RUN=1,
 * INGEST_CHUNK = "auto" (default: day of the year modulo the number of chunks), a chunk number, or "all",
 * INGEST_CHUNK_SIZE (default 60 countries per run).
 * Run with: npm run ingest:external
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { fetchGdhoOrganizationsForCountry } from "../lib/gdho";
import { fetchHdxOrganizationsForCountry } from "../lib/hdx";
import { fetchReliefWebOrganizationsForCountry } from "../lib/reliefweb";
import { skipsReliefWeb } from "../lib/sourceRules";
import type { Organization } from "../lib/types";

interface CountryEntry {
  /** English name; also what GDHO's country columns are matched against. */
  name: string;
  /** ISO 3166-1 alpha-2: what the website sends and what external_orgs.country_code holds. */
  code: string;
  /** ISO 3166-1 alpha-3: what HDX (location group) and ReliefWeb (country.iso3) are queried with. */
  iso3: string;
}

type Source = "hdx" | "gdho" | "reliefweb";

const BATCH = 400;
const dryRun = process.env.DRY_RUN === "1";

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

async function loadCountries(): Promise<CountryEntry[]> {
  const codes = JSON.parse(
    await readFile(new URL("./external-countries.json", import.meta.url), "utf8"),
  ) as string[];
  const names = JSON.parse(
    await readFile(new URL("./country-names.json", import.meta.url), "utf8"),
  ) as Record<string, { name: string; iso3: string }>;

  const override = process.env.INGEST_COUNTRIES?.trim();
  if (override) {
    return override
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter((code) => names[code])
      .map((code) => ({ code, name: names[code]!.name, iso3: names[code]!.iso3 }));
  }

  const all = codes
    .filter((code) => names[code])
    .map((code) => ({ code, name: names[code]!.name, iso3: names[code]!.iso3 }));

  const size = Math.max(1, Number(process.env.INGEST_CHUNK_SIZE) || 60);
  const chunks = Math.ceil(all.length / size);
  // Equal-sized chunks (e.g. 244 countries -> 5 x 49) instead of four full ones and a stub.
  const perChunk = Math.ceil(all.length / chunks);
  const requested = (process.env.INGEST_CHUNK ?? "auto").trim().toLowerCase();
  if (requested === "all") {
    console.log(`[ingest] all ${all.length} countries`);
    return all;
  }
  const index =
    requested === "auto" || requested === ""
      ? dayOfYear(new Date()) % chunks
      : Math.min(Math.max(0, Math.floor(Number(requested)) || 0), chunks - 1);
  console.log(`[ingest] chunk ${index + 1} of ${chunks} (${perChunk} countries per chunk)`);
  return all.slice(index * perChunk, (index + 1) * perChunk);
}

function toRow(org: Organization, source: Source, country: CountryEntry) {
  return {
    id: org.id,
    source,
    country_code: country.code,
    country_key: country.name.toLowerCase(),
    country: country.name,
    name: org.name,
    slug: org.slug,
    category: org.category,
    description: org.description || null,
    city: org.city || null,
    address: org.address || null,
    website: org.website || null,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const countries = await loadCountries();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!dryRun && (!url || !key)) {
    console.log("[ingest] Supabase URL / service key not set; nothing to do.");
    return;
  }
  const hasReliefWeb = Boolean(process.env.RELIEFWEB_APPNAME?.trim());
  if (!hasReliefWeb) console.warn("[ingest] RELIEFWEB_APPNAME is not set; ReliefWeb is skipped.");

  // No timedFetch here: batch writes are larger than the website's 3 s database budget.
  const client = dryRun ? null : createClient(url, key, { auth: { persistSession: false } });

  let stored = 0;
  let failedSources = 0;
  for (const country of countries) {
    const fetched: Array<[Source, () => Promise<Organization[]>]> = [
      ["hdx", () => fetchHdxOrganizationsForCountry(country.name, country.iso3)],
      ["gdho", () => fetchGdhoOrganizationsForCountry(country.name)],
    ];
    if (hasReliefWeb && !skipsReliefWeb(country.name, country.code)) {
      fetched.push(["reliefweb", () => fetchReliefWebOrganizationsForCountry(country.name, country.iso3)]);
    }

    for (const [source, run] of fetched) {
      const started = Date.now();
      let orgs: Organization[] = [];
      try {
        orgs = await run();
      } catch (error) {
        console.warn(`[ingest] ${country.code} ${source} failed:`, error instanceof Error ? error.message : error);
      }
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`[ingest] ${country.code} ${source}: ${orgs.length} organization(s) in ${seconds}s`);

      // An empty answer is treated as a failed download: keep what is already stored.
      if (orgs.length === 0) {
        failedSources += 1;
        continue;
      }
      if (!client) continue;

      const rows = [...new Map(orgs.map((org) => [org.id, toRow(org, source, country)])).values()];
      const del = await client.from("external_orgs").delete().eq("source", source).eq("country_code", country.code);
      if (del.error) throw new Error(`delete ${country.code}/${source}: ${del.error.message}`);
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await client.from("external_orgs").upsert(rows.slice(i, i + BATCH), { onConflict: "country_code,id" });
        if (error) throw new Error(`upsert ${country.code}/${source}: ${error.message}`);
      }
      stored += rows.length;
    }
  }

  console.log(`[ingest] done: ${stored} row(s) written, ${failedSources} empty/failed source call(s).`);
}

main().catch((error) => {
  console.error("[ingest] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
