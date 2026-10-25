import { expect, test } from "@playwright/test";
import { fillRequired, humanPause, alertBox } from "./helpers";

// Runs last: it deliberately exhausts the per-connection enquiry allowance.
test("repeated enquiries from one connection are rate limited with a phone fallback", async ({ page }) => {
  test.setTimeout(240_000);
  // Limit is 5 per fixed 10-minute window. Allowing 12 attempts guarantees a block
  // even if the run straddles a window boundary (where the count resets).
  let blocked = false;
  for (let i = 0; i < 12 && !blocked; i++) {
    await page.goto("/contact");
    await fillRequired(page, `Limit Test ${i}`);
    await humanPause(page);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    const outcome = await Promise.race([
      page.getByRole("heading", { name: "Enquiry received" }).waitFor().then(() => "ok" as const),
      alertBox(page).waitFor().then(() => "blocked" as const),
    ]);
    blocked = outcome === "blocked";
  }
  expect(blocked).toBe(true);
  await expect(alertBox(page)).toContainText("096725 67423");
});
