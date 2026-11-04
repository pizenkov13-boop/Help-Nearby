import { test, expect } from "./fixtures";

/**
 * Regional limit (BLOCKED_COUNTRIES). The fictitious code ZZ stands in for a real one.
 * - Normal run (no variable): nothing is blocked, whatever the header says.
 * - `npm run test:e2e:region` (own server with BLOCKED_COUNTRIES=ZZ): only ZZ gets 403.
 * - Copy mode ignores the variable: see copy-mode.spec.ts.
 */
const REGION_RUN = process.env.E2E_REGION_BLOCK === "1";

const asZz = { "x-vercel-ip-country": "ZZ" };

test.describe("without BLOCKED_COUNTRIES", () => {
  test.skip(REGION_RUN, "the variable is set in this run");

  test("a request that claims to come from ZZ is served normally", async ({ request }) => {
    const response = await request.get("/", { headers: asZz });
    expect(response.status()).toBe(200);
  });
});

test.describe("with BLOCKED_COUNTRIES=ZZ", () => {
  test.skip(!REGION_RUN, "needs the region server (npm run test:e2e:region)");

  test("ZZ gets 403 and a neutral page", async ({ request }) => {
    const response = await request.get("/", { headers: asZz });
    expect(response.status()).toBe(403);
    expect(response.headers()["content-type"]).toContain("text/html");
    const body = await response.text();
    expect(body).toContain("Service unavailable");
    expect(body).not.toMatch(/policy|sanction|law|country/i);
  });

  test("the page follows the browser language, with right-to-left for Arabic", async ({ request }) => {
    const cases: [string, string, string][] = [
      ["ru-RU,ru;q=0.9", "Сервис недоступен", 'lang="ru"'],
      ["es", "Servicio no disponible", 'lang="es"'],
      ["fr-FR", "Service indisponible", 'lang="fr"'],
      ["de", "Dienst nicht verfügbar", 'lang="de"'],
      ["zh-CN", "服务不可用", 'lang="zh"'],
      ["ar", "الخدمة غير متاحة", 'dir="rtl"'],
      ["ja", "Service unavailable", 'lang="en"'],
    ];
    for (const [acceptLanguage, text, marker] of cases) {
      const response = await request.get("/about", { headers: { ...asZz, "accept-language": acceptLanguage } });
      expect(response.status(), acceptLanguage).toBe(403);
      const body = await response.text();
      expect(body, acceptLanguage).toContain(text);
      expect(body, acceptLanguage).toContain(marker);
    }
  });

  test("another code, or no header at all, is let through", async ({ request }) => {
    expect((await request.get("/", { headers: { "x-vercel-ip-country": "YY" } })).status()).toBe(200);
    expect((await request.get("/")).status()).toBe(200);
  });

  test("service files stay reachable: robots, sitemap, static files, ping and deployments", async ({ request }) => {
    expect((await request.get("/robots.txt", { headers: asZz })).status()).toBe(200);
    expect((await request.get("/sitemap.xml", { headers: asZz })).status()).toBe(200);
    // 403 alone proves nothing for a route's own answer: what must be absent is the block page.
    for (const response of [
      await request.get("/favicon.ico", { headers: asZz }),
      await request.get("/api/cron/ping", { headers: asZz }),
      await request.post("/api/deployments", { headers: asZz, data: {} }),
    ]) {
      expect(await response.text()).not.toContain("Service unavailable");
    }
    expect((await request.get("/manifest.webmanifest", { headers: asZz })).status()).toBe(200);
  });

  test("other pages and API routes are blocked for ZZ", async ({ request }) => {
    expect((await request.get("/privacy", { headers: asZz })).status()).toBe(403);
    expect((await request.post("/api/nearby", { headers: asZz, data: { lat: 1, lng: 1 } })).status()).toBe(403);
  });
});
