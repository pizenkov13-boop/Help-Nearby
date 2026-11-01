import { defineConfig, devices } from "@playwright/test";

/**
 * Copy-mode run: builds the site as a template deployment (NEXT_PUBLIC_SITE_URL on another domain)
 * and runs only tests/e2e/copy-mode.spec.ts against it. `npm run test:e2e:copy`.
 * It builds into the normal .next folder, so run it after (not during) the main e2e run.
 */
// Workers inherit this, which un-skips tests/e2e/copy-mode.spec.ts.
process.env.E2E_COPY_MODE = "1";

const PORT = process.env.COPY_E2E_PORT ?? "3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /copy-mode\.spec\.ts$/,
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL, serviceWorkers: "block" },
  projects: [{ name: "copy-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 600_000,
        env: {
          PORT,
          NEXT_PUBLIC_SITE_URL: "https://copy.example.org",
          // No database, no AI provider: the copy must work on its own.
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          SUPABASE_SERVICE_ROLE_KEY: "",
          POSTGRES_URL_NON_POOLING: "",
          AITUNNEL_API_KEY: "",
          DISABLE_PING: "true",
        },
      },
});
