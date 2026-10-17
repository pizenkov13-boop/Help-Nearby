import { test, expect } from "@playwright/test";
import {
  cleanOsmOrganizations,
  dedupeOsmOrganizations,
  hasClosedLifecycleTag,
  removeJunkOsmOrganizations,
} from "@/lib/osmCleanup";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

// ~0.00001° latitude ≈ 1.1 m
const osm = (id: string, name: string, overrides: Partial<Organization> = {}): Organization => ({
  ...base,
  id: `overpass-node-${id}`,
  slug: `osm-node-${id}`,
  name,
  lat: 48.8566,
  lng: 2.3522,
  phone: "",
  website: "",
  address: "",
  hoursRaw: "",
  ...overrides,
});

test.describe("OSM cleanup", () => {
  test("same name within 100 m keeps the record with more fields", () => {
    const poor = osm("1", "Pharmacie Centrale");
    const rich = osm("2", "  pharmacie centrale ", {
      lat: 48.8566 + 0.0004, // ≈ 44 m away
      phone: "+33100000000",
      address: "1 Rue Test",
    });
    const kept = dedupeOsmOrganizations([poor, rich]);
    expect(kept.map((o) => o.id)).toEqual([rich.id]);
  });

  test("tie on richness keeps the first record and the original order", () => {
    const a = osm("1", "Clinic A");
    const b = osm("2", "Clinic A", { lat: 48.8566 + 0.0002 });
    const other = osm("3", "Other Place", { lat: 48.9 });
    expect(dedupeOsmOrganizations([other, a, b]).map((o) => o.id)).toEqual([other.id, a.id]);
  });

  test("a chain with far-apart branches is not touched", () => {
    const branches = [0, 0.01, 0.02].map((delta, i) =>
      osm(String(i), "Pharmacie du Soleil", { lat: 48.8566 + delta }),
    );
    expect(dedupeOsmOrganizations(branches)).toHaveLength(3);
  });

  test("names shorter than 4 characters are hidden", () => {
    const orgs = [osm("1", "TAS"), osm("2", "АНЦ"), osm("3", " ab "), osm("4", "Café")];
    expect(removeJunkOsmOrganizations(orgs).map((o) => o.name)).toEqual(["Café"]);
  });

  test("a name repeated 5+ times is hidden only for records without phone, website and address", () => {
    const repeated = Array.from({ length: 5 }, (_, i) =>
      osm(String(i), "Rental houses", { lat: 48.8566 + i * 0.01 }),
    );
    const withContact = osm("9", "Rental houses", { lat: 48.99, phone: "+33100000000" });
    const result = removeJunkOsmOrganizations([...repeated, withContact]);
    expect(result.map((o) => o.id)).toEqual([withContact.id]);

    // four repeats stay
    expect(removeJunkOsmOrganizations(repeated.slice(0, 4))).toHaveLength(4);
  });

  test("closed lifecycle tags are recognised", () => {
    expect(hasClosedLifecycleTag({ amenity: "pharmacy", "disused:amenity": "pharmacy" })).toBe(true);
    expect(hasClosedLifecycleTag({ amenity: "clinic", "abandoned:healthcare": "clinic" })).toBe(true);
    expect(hasClosedLifecycleTag({ amenity: "clinic", "was:name": "Old" })).toBe(true);
    expect(hasClosedLifecycleTag({ amenity: "clinic", name: "Open clinic", phone: "1" })).toBe(false);
    expect(hasClosedLifecycleTag(undefined)).toBe(false);
  });

  test("cleanOsmOrganizations reports what was removed", () => {
    const orgs = [
      osm("1", "Good Clinic", { phone: "+33100000000" }),
      osm("2", "Good Clinic", { lat: 48.8566 + 0.0001 }), // duplicate
      osm("3", "XY"), // junk
    ];
    const { organizations, stats } = cleanOsmOrganizations(orgs, 2);
    expect(organizations.map((o) => o.id)).toEqual(["overpass-node-1"]);
    expect(stats).toEqual({ before: 5, duplicates: 1, junk: 1, closed: 2, after: 1 });
  });
});
