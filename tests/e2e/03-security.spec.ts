import { expect, test } from "@playwright/test";
import { alertBox } from "./helpers";

const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

test("signed-out visitors are sent to the login page from every admin route", async ({ page }) => {
  for (const path of ["/admin", "/admin/leads", "/admin/leads/anything", "/admin/pricing", "/admin/pricing/new"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/admin\/login$/);
  }
});

test("a forged session cookie gets no data", async ({ page, context }) => {
  await context.addCookies([{ name: "__session", value: "forged.token.value", url: "http://localhost:3100" }]);
  await page.goto("/admin/leads");
  // The proxy lets it through (cookie present) but the server-side check rejects it.
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("an authenticated user without the admin claim is refused", async ({ page, request }) => {
  const signUp = await request.post(
    `http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`,
    { data: { email: "visitor@example.test", password: "Visitor#2026", returnSecureToken: true } },
  );
  expect(signUp.ok()).toBe(true);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("visitor@example.test");
  await page.getByLabel("Password").fill("Visitor#2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(alertBox(page)).toContainText("doesn't have admin access");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("wrong password shows a clear error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("owner@example.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(alertBox(page)).toContainText("don't match an admin account");
});

test("session endpoint rejects cross-site requests and junk tokens", async ({ request }) => {
  const cross = await request.post("/api/admin/session", {
    headers: { Origin: "https://evil.example" },
    data: { idToken: "x".repeat(50) },
  });
  expect(cross.status()).toBe(403);

  const junk = await request.post("/api/admin/session", {
    headers: { Origin: "http://localhost:3100" },
    data: { idToken: "x".repeat(50) },
  });
  expect(junk.status()).toBe(401);
});

test("admin responses are marked private and noindex", async ({ request }) => {
  const res = await request.get("/admin/login");
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
  expect(res.headers()["x-frame-options"]).toBe("DENY");
});

test("Firestore rules deny direct client access", async ({ request }) => {
  const fs = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
  // An unauthenticated REST read (as a browser with the web API key would make) must fail.
  const res = await request.get(`http://${fs}/v1/projects/demo-ssinfra/databases/(default)/documents/leads`);
  expect(res.status()).toBe(403);
});
