import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { login } from "./helpers";

/** Clicks save and waits for the Server Action round trip, not a message left over from a previous save. */
async function saveAndWait(page: Page) {
  const done = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/pricing"));
  await page.getByRole("button", { name: "Save changes" }).click();
  await done;
  await expect(page.getByText("Package saved.")).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("seeded templates are hidden from the public site", async ({ page }) => {
  await page.goto("/courts-solutions#pricing");
  await expect(page.getByText("Every project is quoted individually")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Padel Court – Standard" })).toHaveCount(0);
});

test("publishing and pricing a package shows on the website without a redeploy", async ({ page, context }) => {
  await login(page);
  await page.goto("/admin/pricing");
  await page.getByRole("link", { name: "Padel Court – Standard" }).click();

  // Validation: a starting-from price needs an amount.
  await page.getByLabel("Starting from").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Enter a price for this display mode")).toBeVisible();

  await page.getByLabel("Price (₹)").fill("1500000");
  await page.getByLabel(/Price unit/).fill("per court");
  await expect(page.getByText("₹15,00,000 per court")).toBeVisible(); // live preview
  await page.getByLabel("Show on website").check();
  await saveAndWait(page);

  const visitor = await context.newPage();
  await visitor.goto("/courts-solutions");
  const card = visitor.locator("article", { has: visitor.getByRole("heading", { name: "Padel Court – Standard" }) });
  await expect(card).toBeVisible();
  await expect(card.getByText("Starting from")).toBeVisible();
  await expect(card.getByText("₹15,00,000")).toBeVisible();

  // The package CTA pre-selects the package in the enquiry form.
  await card.getByRole("link", { name: "Request a Quote" }).click();
  await expect(visitor).toHaveURL(/package=padel-standard/);
  await expect(visitor.getByText("Enquiring about: Padel Court – Standard")).toBeVisible();
  await expect(visitor.getByRole("radio", { name: "Padel Court Manufacturing & Installation" })).toBeChecked();

  // Switching to contact-for-pricing removes the figure publicly.
  await page.getByLabel("Contact for pricing").check();
  await saveAndWait(page);
  await visitor.goto("/courts-solutions");
  await expect(visitor.getByText("₹15,00,000")).toHaveCount(0);

  // Hiding removes it entirely.
  await page.goto("/admin/pricing");
  const row = page.locator("li", { hasText: "Padel Court – Standard" });
  await row.getByRole("button", { name: "Hide" }).click();
  await expect(row.getByText("Hidden")).toBeVisible();
  await visitor.goto("/courts-solutions");
  await expect(visitor.getByRole("heading", { name: "Padel Court – Standard" })).toHaveCount(0);
});

test("packages can be created and deleted with confirmation", async ({ page }) => {
  await login(page);
  await page.goto("/admin/pricing/new");
  await page.getByLabel("Package name").fill("Test Court Package");
  await expect(page.getByLabel("URL name")).toHaveValue("test-court-package");
  await page.getByLabel("Included").fill("Item one\nItem two");
  await page.getByRole("button", { name: "Create package" }).click();
  await expect(page).toHaveURL(/\/admin\/pricing\/[\w-]+\?saved=1/);
  await expect(page.getByText(/Package created/)).toBeVisible();

  // Duplicate slug is rejected.
  await page.goto("/admin/pricing/new");
  await page.getByLabel("Package name").fill("Test Court Package");
  await page.getByRole("button", { name: "Create package" }).click();
  await expect(page.getByText("Another package already uses this URL name.")).toBeVisible();

  await page.goto("/admin/pricing");
  await page.getByRole("link", { name: "Test Court Package" }).click();
  await page.getByRole("button", { name: "Delete package" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep package" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Delete package" }).click();
  await dialog.getByRole("button", { name: "Delete package" }).click();
  await expect(page).toHaveURL(/\/admin\/pricing\?deleted=1/);
  await expect(page.getByRole("link", { name: "Test Court Package" })).toHaveCount(0);
});
