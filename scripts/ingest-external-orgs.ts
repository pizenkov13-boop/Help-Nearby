/**
 * Daily job (GitHub Actions, see .github/workflows/external-orgs.yml): downloads the HDX, GDHO and
 * ReliefWeb organization catalogs per country and stores them in the Supabase table external_orgs,
 * so the website never has to call those slow sources from Vercel.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, RELIEFWEB_APPNAME (optional).
 * Optional: INGEST_COUNTRIES="Kenya:KE,Uganda:UG" (default: scripts/external-countries.json), DRY_RUN=1.
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
  name: string;
  code: string;
}

type Source = "hdx" | "gdho" | "reliefweb";

const BATCH = 400;
const dryRun = process.env.DRY_RUN === "1";

async function loadCountries(): Promise<CountryEntry[]> {
  const override = process.env.INGEST_COUNTRIES?.trim();
  if (override) {
    return override.split(",").map((part) => {
      const [name, code] = part.split(":").map((x) => x.trim());
      return { name: name ?? "", code: (code ?? "").toUpperCase() };
    });
  }
  const raw = await readFile(new URL("./external-countries.json", import.meta.url), "utf8");
  return JSON.parse(raw) as CountryEntry[];
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
  const countries = (await loadCountries()).filter((c) => c.name && c.code.length === 2);
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
      ["hdx", () => fetchHdxOrganizationsForCountry(country.name, country.code)],
      ["gdho", () => fetchGdhoOrganizationsForCountry(country.name)],
    ];
    if (hasReliefWeb && !skipsReliefWeb(country.name, country.code)) {
      fetched.push(["reliefweb", () => fetchReliefWebOrganizationsForCountry(country.name, country.code)]);
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
