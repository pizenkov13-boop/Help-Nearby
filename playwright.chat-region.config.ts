import { defineConfig, devices } from "@playwright/test";

/**
 * Chat run: the main site (not a copy) with FORMS_DISABLED_COUNTRIES=XX, the chat on, and the AI
 * service replaced by a stub that tests/e2e/chat-region.spec.ts starts and counts requests on.
 * Runs only that spec. `npm run test:e2e:chat-region`.
 * It builds into the normal .next folder, so run it after (not during) the main e2e run.
 */
// Workers inherit this, which un-skips the spec.
process.env.E2E_CHAT_REGION = "1";

const PORT = process.env.CHAT_REGION_E2E_PORT ?? "3201";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /chat-region\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL, serviceWorkers: "block" },
  projects: [{ name: "chat-region-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 600_000,
        env: {
          PORT,
          FORMS_DISABLED_COUNTRIES: "XX",
          CHAT_ENABLED: "true",
          // A fake key and the local stub: nothing in this run can reach a real AI service.
          AITUNNEL_API_KEY: "test-key-not-real",
          AITUNNEL_BASE_URL: "http://127.0.0.1:3299/v1/",
          DISABLE_PING: "true",
        },
      },
});
