import { test, expect } from "@playwright/test";
import { mockNearbyApi, openMapWithOrgs, preferFullMode } from "./helpers";

// The position travels only in JSON POST bodies, never in a URL (access logs, history, Referer).
const COORDINATE_PARAM = /[?&](lat|lng|lon|fromLat|fromLng|toLat|toLng)=/i;

test.describe("Coordinates are not sent in URLs", () => {
  test("a search sends the position in POST bodies and no request URL carries coordinates", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await preferFullMode(page);
    await mockNearbyApi(page);

    const apiRequests: { method: string; url: string; body: unknown }[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/\/api\//.test(url)) {
        apiRequests.push({
          method: request.method(),
          url,
          body: request.method() === "POST" ? request.postDataJSON() : null,
        });
      }
    });

    await openMapWithOrgs(page);

    expect(apiRequests.length).toBeGreaterThan(0);
    for (const request of apiRequests) {
      expect(request.url, `${request.method} ${request.url}`).not.toMatch(COORDINATE_PARAM);
    }

    const nearby = apiRequests.find((r) => /\/api\/nearby$/.test(r.url));
    expect(nearby?.method).toBe("POST");
    expect(nearby?.body).toMatchObject({
      lat: expect.any(Number),
      lng: expect.any(Number),
      radius: expect.any(Number),
    });
  });
});

test.describe("Coordinate routes accept POST only", () => {
  const routes = [
    "/api/organizations",
    "/api/nearby",
    "/api/verified-nearby",
    "/api/emergency",
    "/api/route",
    "/api/nearest",
    "/api/geocode/reverse",
  ];

  for (const path of routes) {
    test(`GET ${path}?lat=... is not served`, async ({ request }) => {
      const res = await request.get(`${path}?lat=40.7&lng=-74&lon=-74&country=France`);
      expect(res.status()).toBe(405);
    });
  }

  test("invalid bodies are rejected without calling any provider", async ({ request }) => {
    const nearby = await request.post("/api/nearby", { data: {} });
    expect(nearby.status()).toBe(200);
    expect(await nearby.json()).toEqual([]);

    for (const path of ["/api/emergency", "/api/nearest", "/api/route", "/api/geocode/reverse"]) {
      const empty = await request.post(path, { data: {} });
      expect(empty.status(), `${path} with an empty body`).toBe(400);
      // a missing coordinate is not 0
      const partial = await request.post(path, { data: { lat: 40.7 } });
      expect(partial.status(), `${path} with only lat`).toBe(400);
    }

    const noCountry = await request.post("/api/verified-nearby", { data: {} });
    expect(await noCountry.json()).toEqual([]);
  });
});
