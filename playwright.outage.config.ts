import { defineConfig, devices } from "@playwright/test";

/*
 * Database-outage checks against a real production build (`next build` + `next start`).
 * Needs no emulator and no Firebase project, and can never reach live Firebase:
 *
 *   OUTAGE_MODE=unreachable   emulator mode pointed at a closed port (Firestore down)
 *   OUTAGE_MODE=unconfigured  every Firebase variable blanked (no credentials at all)
 *
 * Run both with `npm run test:outage`. It rebuilds .next, so stop any other
 * `next start`/`next build` first. Empty strings matter: Next.js won't let .env.local
 * fill a variable that the process environment already defines, even as "".
 */
const mode = process.env.OUTAGE_MODE === "unconfigured" ? "unconfigured" : "unreachable";
const PORT = 3200;
const CLOSED = "127.0.0.1:9"; // nothing listens on the discard port

const env: Record<string, string> =
  mode === "unreachable"
    ? {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ssinfra",
        NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-ssinfra.firebaseapp.com",
        NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
        FIRESTORE_EMULATOR_HOST: CLOSED,
        FIREBASE_AUTH_EMULATOR_HOST: CLOSED,
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: CLOSED,
        FIREBASE_PROJECT_ID: "",
      }
    : {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
        NEXT_PUBLIC_FIREBASE_API_KEY: "",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
        NEXT_PUBLIC_FIREBASE_APP_ID: "",
        FIREBASE_PROJECT_ID: "",
        FIREBASE_CLIENT_EMAIL: "",
        FIREBASE_PRIVATE_KEY: "",
        FIRESTORE_EMULATOR_HOST: "",
        FIREBASE_AUTH_EMULATOR_HOST: "",
        NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "",
      };

export default defineConfig({
  testDir: "tests/outage",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  metadata: { mode },
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome", trace: "retain-on-failure" },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    env: {
      ...env,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      ANALYTICS_SALT: "outage-test-salt-not-secret",
      VAPID_PRIVATE_KEY: "",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_SUBJECT: "",
    },
  },
  projects: [{ name: `chrome-${mode}`, use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
