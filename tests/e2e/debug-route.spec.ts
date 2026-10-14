import { test, expect } from "@playwright/test";

test.describe("Debug sources route", () => {
  test("is disabled (404) without a matching DEBUG_TOKEN", async ({ request }) => {
    for (const query of ["", "?token=", "?token=guess&lat=1&lng=1"]) {
      const res = await request.get(`/api/debug/sources${query}`);
      expect(res.status()).toBe(404);
    }
  });
});
