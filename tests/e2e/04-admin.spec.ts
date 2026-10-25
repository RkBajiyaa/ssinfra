import { expect, test } from "@playwright/test";
import { fillRequired, humanPause, login } from "./helpers";

test.describe.configure({ mode: "serial" });

test("dashboard shows real lead counts and the recent enquiry", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Total leads")).toBeVisible();
  // One lead was created by the enquiry spec.
  await expect(page.locator("p", { hasText: "Total leads" }).locator("xpath=following-sibling::p[1]")).toHaveText("1");
  await expect(page.getByRole("link", { name: /Rohan Mehta/ })).toBeVisible();
});

test("leads can be searched, filtered, and updated with persistence", async ({ page, context }) => {
  // Add a second lead for a different service.
  const visitor = await context.newPage();
  await visitor.goto("/contact?service=flooring");
  await fillRequired(visitor, "Priya Nair", "9876501234");
  await visitor.getByRole("radio", { name: "Wooden Sports Flooring" }).check();
  await visitor.getByLabel("Project city").fill("Kochi");
  await visitor.getByLabel("Project state").fill("Kerala");
  await humanPause(visitor);
  await visitor.getByRole("button", { name: "Send enquiry" }).click();
  await expect(visitor.getByRole("heading", { name: "Enquiry received" })).toBeVisible();

  await login(page);
  await page.goto("/admin/leads");
  await expect(page.getByText("2 leads")).toBeVisible();

  await page.getByLabel("Service").selectOption("flooring");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("1 lead", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Priya Nair" })).toBeVisible();

  // Search by partial phone number.
  await page.goto("/admin/leads?q=98765");
  await expect(page.getByText("2 leads")).toBeVisible();
  await page.goto("/admin/leads?q=SSI-00001");
  await expect(page.getByText("1 lead", { exact: true })).toBeVisible();

  // Open, update status and notes.
  await page.goto("/admin/leads?q=Priya");
  await page.getByRole("link", { name: "Priya Nair" }).click();
  await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+919876501234");
  await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/919876501234\?text=/);

  await page.getByRole("radio", { name: "Contacted" }).check();
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(page.getByText("Status saved.")).toBeVisible();
  await page.getByLabel("Internal notes").fill("Called on Monday. Wants maple-look finish.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect(page.getByText("Notes saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("radio", { name: "Contacted" })).toBeChecked();
  await expect(page.getByLabel("Internal notes")).toHaveValue("Called on Monday. Wants maple-look finish.");

  await page.goto("/admin/leads?status=contacted");
  await expect(page.getByText("1 lead", { exact: true })).toBeVisible();
  await page.goto("/admin/leads?status=won");
  await expect(page.getByText("No leads match these filters")).toBeVisible();
});

test("admin works on a phone-sized screen", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await login(page);
  for (const path of ["/admin", "/admin/leads", "/admin/pricing"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: /Leads/ }).click();
  await expect(page).toHaveURL(/\/admin\/leads$/);
});

test("sign out ends the session", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
