import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    serviceWorkers: "block",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /\.webkit\.spec\.ts$|copy-mode\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    // iOS Safari engine: the phone menu bug only reproduced on WebKit.
    {
      name: "webkit-iphone-14",
      testMatch: /\.webkit\.spec\.ts$/,
      // Video capture makes WebKit workers hang on teardown on Windows.
      use: { ...devices["iPhone 14"], video: "off" },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Production build: no on-demand dev compilation, so parallel workers stay stable.
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 600_000,
        // Never let e2e reach the real AI provider, even if .env.local holds a key.
        env: {
          AITUNNEL_API_KEY: "",
          DEBUG_TOKEN: "",
          E2E_FIXTURE_ORGS: "1",
          // Test-only admin credentials (never real): they override anything in .env.local.
          ADMIN_PASSWORD: "e2e-admin-password",
          ADMIN_SESSION_SECRET: "e2e-session-secret-0123456789-abcdefghij",
        },
      },
});
