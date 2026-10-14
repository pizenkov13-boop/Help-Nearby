import { test, expect } from "@playwright/test";
import {
  searchAllSources,
  type ChatSearchDeps,
  type GeocodedPlace,
} from "@/lib/chatSearch";
import { buildSystemPrompt } from "@/lib/chatPrompt.server";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS } from "./helpers";

// These tests inject fake sources, so nothing here touches the network or the AI provider.

const base = MOCK_NEARBY_ORGS[0] as Organization;

function org(overrides: Partial<Organization>): Organization {
  return {
    ...base,
    hours: {},
    hoursRaw: "",
    distance: "",
    verified: true,
    ...overrides,
  };
}

const NO_VERIFIED = { hdx: [], gdho: [], reliefweb: [] };

function deps(overrides: Partial<ChatSearchDeps>): ChatSearchDeps {
  return {
    geocode: async () => null,
    reverse: async () => null,
    supabase: async () => [],
    verified: async () => NO_VERIFIED,
    overpass: async () => [],
    ...overrides,
  };
}

const nice: GeocodedPlace = {
  lat: 43.7102,
  lng: 7.262,
  country: "France",
  countryCode: "FR",
  isCountry: false,
};

test.describe("AI chat server-side search", () => {
  test("city with Supabase results (Nice): catalog first, then OSM, labelled by source", async () => {
    const result = await searchAllSources(
      { place: "Nice", category: "food", clientLocation: null, clientCountry: null },
      deps({
        geocode: async () => nice,
        supabase: async () => [
          org({ id: "1", name: "CRF Nice Aide alimentaire", lat: 43.72, lng: 7.27, city: "Nice", country: "France", phone: "+33400000000", distance: "0.4 mi" }),
        ],
        overpass: async () => [
          org({ id: "overpass-node-1", name: "Soupe Populaire Nice", lat: 43.71, lng: 7.26, city: "Nice", verified: false, description: "soup_kitchen", distance: "0.2 mi" }),
          org({ id: "overpass-node-2", name: "Pharmacie Centrale", lat: 43.7, lng: 7.25, verified: false, description: "pharmacy", distance: "0.1 mi" }),
        ],
        verified: async () => ({
          ...NO_VERIFIED,
          reliefweb: [org({ id: "rw-1", name: "Secours Populaire", country: "France", lat: 0, lng: 0 })],
        }),
      }),
    );

    expect(result.counts).toMatchObject({ supabase: 1, osm: 1, reliefweb: 1 });
    expect(result.organizations.map((o) => [o.name, o.source])).toEqual([
      ["CRF Nice Aide alimentaire", "Supabase"],
      ["Soupe Populaire Nice", "OSM"],
      ["Secours Populaire", "ReliefWeb"],
    ]);
    expect(result.organizations[0]!.distance).toBe("0.4 mi");
    expect(result.organizations[0]!.countryLevel).toBe(false);
    expect(result.organizations[2]!.countryLevel).toBe(true);
    // Pharmacies are excluded unless the user asked for medical help.
    expect(result.organizations.some((o) => o.name.includes("Pharmacie"))).toBe(false);

    const prompt = buildSystemPrompt(result.organizations, "France", result.searched);
    expect(prompt).toContain("CRF Nice Aide alimentaire");
    expect(prompt).toContain("source: Help Nearby verified directory");
    expect(prompt).not.toMatch(/source: Supabase/);
    expect(prompt).toContain("source: OpenStreetMap");
  });

  test("country with only OCHA results (Sudan): flagged as country-level directory", async () => {
    let overpassCalled = false;
    const result = await searchAllSources(
      { place: "Sudan", category: "food", clientLocation: null, clientCountry: null },
      deps({
        geocode: async () => ({
          lat: 15.5,
          lng: 32.5,
          country: "Sudan",
          countryCode: "SD",
          isCountry: true,
        }),
        overpass: async () => {
          overpassCalled = true;
          return [];
        },
        verified: async () => ({
          hdx: [org({ id: "hdx-1", name: "HDX Relief Org", country: "Sudan", lat: 0, lng: 0 })],
          gdho: [org({ id: "gdho-1", name: "GDHO Aid Org", country: "Sudan", lat: 0, lng: 0 })],
          reliefweb: [],
        }),
      }),
    );

    expect(overpassCalled).toBe(false); // no OSM search around a country centroid
    expect(result.organizations.map((o) => o.source).sort()).toEqual(["GDHO", "HDX"]);
    expect(result.organizations.every((o) => o.countryLevel)).toBe(true);

    const prompt = buildSystemPrompt(result.organizations, "Sudan", true);
    expect(prompt).toContain("country-level directory, exact office address not confirmed");
  });

  test("place with no results anywhere: empty list and plain no-results guidance", async () => {
    const result = await searchAllSources(
      { place: "Nowhereville", category: "shelter", clientLocation: null, clientCountry: null },
      deps({ geocode: async () => null }),
    );
    expect(result.organizations).toEqual([]);
    expect(result.searched).toBe(true);

    const prompt = buildSystemPrompt([], "", result.searched);
    expect(prompt).toContain("(no results from any source)");
    expect(prompt).toContain("try a larger area");
    expect(prompt).toContain("Emergency mode");
  });

  test("a failing or slow source does not break the others", async () => {
    const result = await searchAllSources(
      { place: "Nice", category: "food", clientLocation: null, clientCountry: null },
      deps({
        geocode: async () => nice,
        supabase: async () => {
          throw new Error("db down");
        },
        overpass: () => new Promise(() => {}), // never resolves
        verified: async () => ({
          ...NO_VERIFIED,
          gdho: [org({ id: "gdho-9", name: "GDHO Only", country: "France", lat: 0, lng: 0 })],
        }),
      }),
      { timeoutMs: 200 },
    );
    expect(result.organizations.map((o) => o.name)).toEqual(["GDHO Only"]);
  });

  test("caps results at 10", async () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      org({ id: `s${i}`, name: `Org ${i}`, lat: 43 + i, lng: 7 + i, distance: `${i} mi` }),
    );
    const result = await searchAllSources(
      { place: "Nice", category: null, clientLocation: null, clientCountry: null },
      deps({ geocode: async () => nice, supabase: async () => many }),
    );
    expect(result.organizations).toHaveLength(10);
  });
});
