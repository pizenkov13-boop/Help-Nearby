import { test, expect } from "@playwright/test";
import { mapDbOrganization, type DbOrganization } from "@/lib/data";
import { sortOrganizationsForList } from "@/lib/mergeOrganizations";
import type { Organization } from "@/lib/types";
import { MOCK_NEARBY_ORGS } from "./helpers";

const base = MOCK_NEARBY_ORGS[0] as Organization;

const make = (overrides: Partial<Organization>): Organization => ({
  ...base,
  hours: {},
  hoursRaw: "",
  verified: true,
  ...overrides,
});

test.describe("List order", () => {
  test("coordinates first by distance; entries without coordinates last with no distance", () => {
    const rw = make({ id: "rw-1", name: "ReliefWeb no coords", lat: 0, lng: 0, distance: "" });
    const far = make({ id: "11", name: "Verified far", distance: "40 mi" });
    const near = make({ id: "12", name: "Verified near", distance: "1.2 mi" });
    const osmNear = make({ id: "overpass-node-1", name: "OSM near", verified: false, distance: "0.3 mi" });
    const hdxGeocoded = make({ id: "hdx-2", name: "HDX geocoded", distance: "362 mi" });
    const noCoordsCatalog = make({ id: "13", name: "Catalog no coords", lat: 0, lng: 0, distance: "" });

    const sorted = sortOrganizationsForList([
      rw,
      hdxGeocoded,
      osmNear,
      far,
      noCoordsCatalog,
      near,
    ]);

    expect(sorted.map((o) => o.name)).toEqual([
      "Verified near",
      "Verified far",
      "OSM near",
      "HDX geocoded",
      // no coordinates: always last
      "ReliefWeb no coords",
      "Catalog no coords",
    ]);
    for (const o of sorted.slice(-2)) expect(o.distance).toBe("");
  });

  test("catalog rows without coordinates get no distance (not a distance to 0,0)", () => {
    const row = (lat: number | null, lng: number | null): DbOrganization => ({
      id: 1,
      name: "Row",
      slug: "row",
      category: ["food"],
      description: null,
      address: null,
      city: null,
      country: "France",
      lat,
      lng,
      phone: null,
      email: null,
      website: null,
      hours: null,
      rating: null,
      verified: true,
      created_at: null,
    });
    const user = { lat: 43.71, lng: 7.26 };

    expect(mapDbOrganization(row(null, null), user).distance).toBe("");
    expect(mapDbOrganization(row(0, 0), user).distance).toBe("");
    expect(mapDbOrganization(row(43.72, 7.27), user).distance).not.toBe("");
  });
});
