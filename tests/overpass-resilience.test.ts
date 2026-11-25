import test from "node:test";
import assert from "node:assert/strict";
import { fetchNearbyOverpassOrganizations } from "../lib/overpass.server";

test("incomplete Overpass response is rejected and next mirror is used", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response(JSON.stringify({ elements: [], remark: "runtime error: Query timed out" }), { status: 200 });
    return new Response(JSON.stringify({ elements: [{ type: "node", id: 184234, lat: 50.001, lon: 30.001, tags: { amenity: "food_bank", name: "Community Food Bank" } }] }), { status: 200 });
  };
  try {
    const result = await fetchNearbyOverpassOrganizations(50, 30, 5000);
    assert.equal(calls, 2);
    assert.equal(result.length, 1);
    assert.equal(result[0].category, "food");
  } finally { globalThis.fetch = original; }
});

test("malformed response does not hide results from a healthy mirror", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response(JSON.stringify({ error: "server overloaded" }), { status: 200 });
    return new Response(JSON.stringify({ elements: [{ type: "node", id: 184235, lat: 51.001, lon: 31.001, tags: { amenity: "food_bank", name: "Local Food Bank" } }] }), { status: 200 });
  };
  try {
    const result = await fetchNearbyOverpassOrganizations(51, 31, 5000);
    assert.equal(calls, 2);
    assert.equal(result[0]?.name, "Local Food Bank");
  } finally { globalThis.fetch = original; }
});

test("Nominatim fallback supplies nearby food results when Overpass mirrors fail", async () => {
  const original = globalThis.fetch;
  const searches: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.hostname !== "nominatim.openstreetmap.org") return new Response("unavailable", { status: 503 });
    const query = url.searchParams.get("q") ?? "";
    searches.push(query);
    const items = query === "food bank" ? [{ osm_type: "node", osm_id: 184236, lat: "52.001", lon: "32.001", name: "Food Bank", category: "amenity", type: "food_bank" }] : [];
    return new Response(JSON.stringify(items), { status: 200 });
  };
  try {
    const result = await fetchNearbyOverpassOrganizations(52, 32, 5000);
    assert.ok(searches.includes("food bank"));
    assert.ok(!searches.includes("pharmacy"));
    assert.equal(result[0]?.category, "food");
    assert.equal(result[0]?.partialSource, true);
  } finally { globalThis.fetch = original; }
});
