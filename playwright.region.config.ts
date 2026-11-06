import { defineConfig, devices } from "@playwright/test";

/**
 * Regional-limit run: the main site (not a copy) built and started with BLOCKED_COUNTRIES=ZZ,
 * running only tests/e2e/region-block.spec.ts, feature-limits.spec.ts and header-nav.spec.ts
 * (FORMS_DISABLED_COUNTRIES=XX and CHAT_ENABLED=false are set too). `npm run test:e2e:region`.
 * It builds into the normal .next folder, so run it after (not during) the main e2e run.
 */
// Workers inherit this, which un-skips the blocked-region tests.
process.env.E2E_REGION_BLOCK = "1";

const PORT = process.env.REGION_E2E_PORT ?? "3200";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /(region-block|feature-limits|header-nav)\.spec\.ts$/,
  fullyParallel: true,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL, serviceWorkers: "block" },
  projects: [{ name: "region-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 600_000,
        env: {
          PORT,
          BLOCKED_COUNTRIES: "ZZ",
          FORMS_DISABLED_COUNTRIES: "XX",
          CHAT_ENABLED: "false",
          DISABLE_PING: "true",
        },
      },
});
