import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests run against the dev server with the Firebase emulators:
 *   1. npm run emulators
 *   2. npm run test:e2e   (starts its own dev server on :3100 with .env.emulator, which overrides .env.local)
 * Global setup wipes the emulator database, so never point this at production.
 * A fresh server per run matters: the wipe happens behind the app's back, so a
 * long-running server would still hold cached package data from an earlier run.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/with-env.mjs .env.emulator npx next dev -p 3100",
    env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3100" },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
