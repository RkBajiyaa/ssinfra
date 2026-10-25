import { expect, test } from "@playwright/test";
import { fillRequired, humanPause, login, alertBox } from "./helpers";

test("required fields are validated inline and focus moves to the first error", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Choose the service you need")).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeFocused();

  await page.getByLabel("Mobile number").fill("12345");
  await page.getByLabel("Mobile number").blur();
  await expect(page.getByText(/valid 10-digit Indian mobile/)).toBeVisible();
});

test("optional email is validated only when supplied", async ({ page }) => {
  await page.goto("/contact");
  await fillRequired(page, "Email Check");
  await page.getByRole("button", { name: /add more project details/i }).click();
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enter a valid email address, or leave it blank")).toBeVisible();
});

test("conditional fields follow the selected service", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("radio", { name: "Padel Court Manufacturing & Installation" }).check();
  await expect(page.getByLabel("Preferred court type")).toBeVisible();
  await expect(page.getByLabel("Flooring requirements")).toHaveCount(0);
  await page.getByRole("radio", { name: "Wooden Sports Flooring" }).check();
  await expect(page.getByLabel("Flooring requirements")).toBeVisible();
  await expect(page.getByLabel("Preferred court type")).toHaveCount(0);
});

test("a valid enquiry is stored once, even when the button is double-clicked", async ({ page, context }) => {
  await page.goto("/contact?service=padel");
  await fillRequired(page, "Rohan Mehta", "+91 98765 43210");
  await page.getByLabel("Number of courts").fill("3");
  await page.getByLabel("Indoor or outdoor").selectOption("outdoor");
  await page.getByRole("button", { name: /add more project details/i }).click();
  await page.getByLabel("Business or organisation").fill("Mehta Sports Club");
  await page.getByLabel("Anything else about the project").fill("<script>alert(1)</script> Site is 45 m × 25 m.");
  await humanPause(page);

  const submit = page.getByRole("button", { name: "Send enquiry" });
  await submit.dblclick();
  await expect(page.getByRole("heading", { name: "Enquiry received" })).toBeVisible();
  await expect(page.getByText(/Thank you for contacting SS Infratech. Your project enquiry has been received./)).toBeVisible();
  const ref = await page.getByText(/^Your reference:/).textContent();
  expect(ref).toMatch(/SSI-\d{5}/);

  const admin = await context.newPage();
  await login(admin);
  await admin.goto("/admin/leads?q=Rohan");
  await expect(admin.getByText("1 lead")).toBeVisible();
  await admin.getByRole("link", { name: "Rohan Mehta" }).first().click();
  await expect(admin.getByRole("heading", { name: "Rohan Mehta" })).toBeVisible();
  await expect(admin.getByRole("definition").filter({ hasText: "+91 98765 43210" })).toBeVisible();
  await expect(admin.getByRole("definition").filter({ hasText: "Mehta Sports Club" })).toBeVisible();
  // Submitted markup is shown as text, never executed.
  await expect(admin.getByText("<script>alert(1)</script> Site is 45 m × 25 m.").last()).toBeVisible();
  await expect(admin.getByText("/contact").first()).toBeVisible();
});

test("too-fast submissions (likely bots) are refused with a recoverable message", async ({ page }) => {
  await page.goto("/contact");
  await fillRequired(page, "Speedy Bot");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(alertBox(page)).toContainText("quicker than expected");
  // Values are preserved for the retry.
  await expect(page.getByLabel("Full name")).toHaveValue("Speedy Bot");
});
