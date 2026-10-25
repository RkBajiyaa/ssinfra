import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "owner@example.test", password: "TestAdmin#2026" };

export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

/** Fills the five required quote fields. */
export async function fillRequired(page: Page, name: string, phone = "98290 12345") {
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("radio", { name: "Padel Court Manufacturing & Installation" }).check();
  await page.getByLabel("Project city").fill("Jaipur");
  await page.getByLabel("Project state").fill("Rajasthan");
}

/** The form rejects submissions faster than 2.5s (bot heuristic), so wait like a person would. */
export async function humanPause(page: Page) {
  await page.waitForTimeout(2700);
}

/** Our own alert banners (Next.js adds an empty role="alert" route announcer to every page). */
export function alertBox(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
