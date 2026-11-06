import http from "node:http";
import { test, expect } from "./fixtures";

/**
 * FORMS_DISABLED_COUNTRIES also switches the chat off. The fictitious code XX stands in for a real one.
 * Run with `npm run test:e2e:chat-region` (own server: FORMS_DISABLED_COUNTRIES=XX, chat on, the AI
 * service replaced by a local stub that counts requests). Skipped in the normal run.
 * Copy mode ignores the variable: see copy-mode.spec.ts.
 */
test.skip(process.env.E2E_CHAT_REGION !== "1", "needs the chat-region server (npm run test:e2e:chat-region)");

const asXx = { "x-vercel-ip-country": "XX" };
const asYy = { "x-vercel-ip-country": "YY" };
const message = { messages: [{ role: "user", content: "hello" }], language: "en" };

test.describe("chat and FORMS_DISABLED_COUNTRIES=XX", () => {
  test.describe.configure({ mode: "serial" });

  let stub: http.Server;
  let aiRequests = 0;

  test.beforeAll(async () => {
    stub = http.createServer((req, res) => {
      aiRequests += 1;
      req.resume();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: "stub answer" } }] }));
    });
    await new Promise<void>((resolve) => stub.listen(3299, "127.0.0.1", resolve));
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => stub.close(() => resolve()));
  });

  test("a visitor from another country gets an answer, and the AI service is reached (the stub proves it)", async ({ request }) => {
    const before = aiRequests;
    const response = await request.post("/api/chat", { headers: asYy, data: message, timeout: 60_000 });
    expect(response.status()).toBe(200);
    expect(aiRequests).toBeGreaterThan(before);
  });

  test("XX: the API answers 403 and nothing is sent to the AI service", async ({ request }) => {
    const before = aiRequests;
    const response = await request.post("/api/chat", { headers: asXx, data: message });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: "Not available." });
    // Also with an empty or broken body: it is refused before the body is even read.
    expect((await request.post("/api/chat", { headers: asXx, data: {} })).status()).toBe(403);
    expect((await request.post("/api/chat", { headers: asXx, data: "not json" })).status()).toBe(403);
    expect(aiRequests).toBe(before);
  });

  test("the features endpoint reports the chat off for XX only, and reveals only booleans", async ({ request }) => {
    expect(await (await request.get("/api/features", { headers: asXx })).json()).toEqual({ chat: false, forms: false });
    expect(await (await request.get("/api/features", { headers: asYy })).json()).toEqual({ chat: true, forms: true });
    expect(await (await request.get("/api/features")).json()).toEqual({ chat: true, forms: true });
  });

  test("XX: the chat widget is not shown, on the home page and on a phone", async ({ page }) => {
    await page.setExtraHTTPHeaders(asXx);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "AI Assistant" })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /AI Assistant|Assistant/i })).toHaveCount(0);
  });

  test("another country sees the chat widget", async ({ page }) => {
    await page.setExtraHTTPHeaders(asYy);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "AI Assistant" })).toBeVisible();
  });
});
