import test from "node:test";
import assert from "node:assert/strict";
import { distanceMiles, formatDistanceMiles } from "../lib/geo";
import { isPlausibleCoordinate } from "../lib/organizationCoordinates";
import { hasValidMapCoordinates } from "../lib/mapCoordinates";
import { fetchSnappedWalkingRoute } from "../lib/osrmRouting.server";
import { snapToNearestWalkingRoad } from "../lib/osrmSnap";

test("distance in kilometres is rounded only after conversion", () => {
  const miles = distanceMiles(0, 0, 0, 0.00674);
  assert.ok(Math.abs(miles * 1.609344 - 0.75) < 0.01);
  const displayedMiles = Number.parseFloat(formatDistanceMiles(0, 0, 0, 0.00674));
  assert.ok(Math.abs(displayedMiles * 1.609344 - 0.75) < 0.01);
  assert.equal(isPlausibleCoordinate(0, 30), true);
  assert.equal(hasValidMapCoordinates({ lat: 51, lng: 0 } as any), true);
});

test("route falls back after walking provider network error and calculates walking minutes", async () => {
  const original = globalThis.fetch;
  let usedFallback = false;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/nearest/")) return new Response(JSON.stringify({ code: "NoSegment" }), { status: 200 });
    if (url.includes("routing.openstreetmap.de")) throw new Error("offline");
    usedFallback = true;
    return new Response(JSON.stringify({ code: "Ok", routes: [{ distance: 1400, duration: 100, geometry: { coordinates: [[30, 50], [30.01, 50]] } }] }), { status: 200 });
  };
  try {
    const route = await fetchSnappedWalkingRoute(50, 30, 50, 30.01);
    assert.equal(usedFallback, true);
    assert.equal(route.distanceKm, 1.4);
    assert.equal(route.durationMinutes, 17);
  } finally { globalThis.fetch = original; }
});

test("road snapping does not replace a location with a faraway road", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ code: "Ok", waypoints: [{ location: [31, 51] }] }), { status: 200 });
  try { assert.deepEqual(await snapToNearestWalkingRoad(30, 50), { lng: 30, lat: 50 }); }
  finally { globalThis.fetch = original; }
});

test("distance and minutes include the final walk to the destination", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (String(input).includes("/nearest/")) return new Response(JSON.stringify({ code: "NoSegment" }), { status: 200 });
    return new Response(JSON.stringify({ code: "Ok", routes: [{ distance: 1000, duration: 600, geometry: { coordinates: [[30, 50], [30.008, 50]] } }] }), { status: 200 });
  };
  try {
    const route = await fetchSnappedWalkingRoute(50, 30, 50, 30.01);
    assert.ok(route.distanceKm > 1.1 && route.distanceKm < 1.2);
    assert.equal(route.durationMinutes, 12);
  } finally { globalThis.fetch = original; }
});
