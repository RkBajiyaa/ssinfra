import { expect, test } from "@playwright/test";
import { alertBox, fillRequired, humanPause } from "../e2e/helpers";

/* Runs with Firestore unreachable or unconfigured (see playwright.outage.config.ts). */

test("every public page loads without a database", async ({ page }) => {
  for (const path of ["/", "/courts-solutions", "/projects", "/contact", "/about", "/privacy"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("h1").first(), path).toBeVisible();
  }
  for (const path of ["/sitemap.xml", "/robots.txt"]) {
    expect((await page.request.get(path)).status(), path).toBe(200);
  }
});

test("pricing falls back to a quotation CTA instead of packages", async ({ page }) => {
  await page.goto("/courts-solutions");
  const pricing = page.locator("#pricing");
  await expect(pricing.getByText("Contact us for current pricing")).toBeVisible();
  await expect(pricing.getByRole("link", { name: "Request a Quote" })).toHaveAttribute("href", "/contact#quote");
  await expect(pricing.getByRole("link", { name: /^Call / })).toHaveAttribute("href", /^tel:\+91/);
  await expect(pricing.locator("article")).toHaveCount(0);
});

test("an enquiry that can't be saved is reported, not shown as sent", async ({ page }) => {
  await page.goto("/contact?package=padel-standard");
  await fillRequired(page, "Outage Visitor");
  await humanPause(page);
  await page.getByRole("button", { name: "Send enquiry" }).click();

  // With Firestore unreachable the SDK keeps retrying; the action gives up after its 8 s / 15 s deadlines.
  const alert = alertBox(page);
  await expect(alert).toContainText(/wasn't sent|couldn't confirm/, { timeout: 30_000 });
  await expect(alert.getByRole("link", { name: /^Call / })).toHaveAttribute("href", /^tel:\+91/);
  await expect(page.getByText(/Your reference/)).toHaveCount(0);
  // Nothing typed is lost.
  await expect(page.getByLabel("Full name")).toHaveValue("Outage Visitor");
  await expect(page.getByLabel("Project city")).toHaveValue("Jaipur");
});

test("admin stays closed and the tracking beacon still answers", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  const res = await request.post("/api/track", {
    headers: { Origin: "http://localhost:3200", "Content-Type": "text/plain" },
    data: JSON.stringify({ p: "/" }),
  });
  expect(res.status()).toBe(204);
});
