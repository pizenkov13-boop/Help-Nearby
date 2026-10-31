import { test, expect } from "./fixtures";
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

  test("a short name is junk only without contacts and without CJK characters", () => {
    const hospitalWithAddress = osm("1", "医院", { address: "1 Test Road" });
    const hospitalNoContacts = osm("2", "医院");
    const zoeWithPhone = osm("3", "Zoe", { phone: "+33100000000" });
    const tasNoContacts = osm("4", "TAS");
    const kept = removeJunkOsmOrganizations([ // "TAS" without contacts is removed
      hospitalWithAddress,
      hospitalNoContacts,
      zoeWithPhone,
      tasNoContacts,
      osm("5", "АНЦ"),
      osm("6", " ab "),
      osm("7", "Café"),
    ]).map((o) => o.name);

    expect(kept).toEqual(["医院", "医院", "Zoe", "Café"]);
    expect(kept).not.toContain("TAS");
  });

  test("a repeated name without contacts is NOT junk (pharmacy chains stay)", () => {
    const chain = Array.from({ length: 8 }, (_, i) =>
      osm(String(i), "Подорожник", { lat: 48.8566 + i * 0.01 }),
    );
    expect(removeJunkOsmOrganizations(chain)).toHaveLength(8);
    expect(dedupeOsmOrganizations(chain)).toHaveLength(8);
  });

  test("same name within 100 m but different phones or addresses are different organizations", () => {
    const mini = [
      osm("1", "Міні ЕКЗ Центр", { phone: "+380 66 083 6099", address: "10/7 Кирилівська вулиця" }),
      osm("2", "Міні ЕКЗ Центр", {
        lat: 48.8566 + 0.0003,
        phone: "+380 44 339 9415;+380 44 332 8158",
        website: "https://www.mini-eco.com/",
      }),
    ];
    expect(dedupeOsmOrganizations(mini)).toHaveLength(2);

    const podorozhnik = [
      osm("3", "Подорожник", { address: "5 Спаська вулиця" }),
      osm("4", "Подорожник", { lat: 48.8566 + 0.0003, address: "3/7 Межигірська вулиця" }),
    ];
    expect(dedupeOsmOrganizations(podorozhnik)).toHaveLength(2);
  });

  test("same place with the same phone or a longer form of the same address is still merged", () => {
    const samePhone = [
      osm("1", "Clinic B", { phone: "+380 44 339 9415" }),
      osm("2", "Clinic B", { lat: 48.8566 + 0.0002, phone: "044 339 94 15", website: "https://b.example" }),
    ];
    expect(dedupeOsmOrganizations(samePhone)).toHaveLength(1);

    const sameAddress = [
      osm("3", "Clinic C", { address: "10/7 Кирилівська вулиця" }),
      osm("4", "Clinic C", { lat: 48.8566 + 0.0002, address: "10/7 Кирилівська вулиця, 04071" }),
    ];
    expect(dedupeOsmOrganizations(sameAddress)).toHaveLength(1);
  });

  test("hospitals are never merged as duplicates nor dropped as junk", () => {
    const hospitals = [
      osm("1", "City Hospital", { osmKind: "hospital" }),
      osm("2", "City Hospital", { lat: 48.8566 + 0.0001, osmKind: "hospital" }),
      osm("3", "ЦМЛ", { osmKind: "hospital" }), // short name, no contacts
    ];
    const { organizations, stats } = cleanOsmOrganizations(hospitals);
    expect(organizations).toHaveLength(3);
    expect(stats).toMatchObject({ duplicates: 0, junk: 0 });
  });

  test("closed lifecycle tags hide a hospital as well", () => {
    expect(
      hasClosedLifecycleTag({ amenity: "hospital", name: "Old Hospital", "disused:healthcare": "hospital" }),
    ).toBe(true);
    expect(hasClosedLifecycleTag({ amenity: "hospital", name: "Open Hospital", emergency: "yes" })).toBe(false);
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
      osm("3", "XY"), // junk: short name, no contacts
    ];
    const { organizations, stats } = cleanOsmOrganizations(orgs, 2);
    expect(organizations.map((o) => o.id)).toEqual(["overpass-node-1"]);
    expect(stats).toEqual({ before: 5, duplicates: 1, junk: 1, closed: 2, after: 1 });
  });
});
