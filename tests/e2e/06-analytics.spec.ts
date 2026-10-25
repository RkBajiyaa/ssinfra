import { expect, test } from "@playwright/test";
import { login } from "./helpers";

// A normal desktop Chrome UA; the default headless UA is (correctly) filtered as a bot.
const HUMAN_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

function statValue(page: import("@playwright/test").Page, label: RegExp) {
  return page.locator("p", { hasText: label }).locator("xpath=following-sibling::p[1]");
}

test("page views and daily visitors are counted, deduplicated and kept separate", async ({ browser, page }) => {
  await login(page);
  const before = {
    views: Number(await statValue(page, /^Page views, last/).textContent()),
    visitors: Number(await statValue(page, /^Visitors, last/).textContent()),
  };

  const visitor = await browser.newContext({ userAgent: HUMAN_UA });
  const v = await visitor.newPage();
  for (const path of ["/", "/courts-solutions", "/contact"]) {
    await v.goto(path);
    await v.waitForTimeout(300);
  }
  // Client-side navigation counts as a page view too.
  await v.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "About Us" }).click();
  await expect(v).toHaveURL(/\/about$/);
  await v.waitForTimeout(800);
  await visitor.close();

  // A bot-like UA is ignored.
  const bot = await browser.newContext({ userAgent: "Googlebot/2.1" });
  await (await bot.newPage()).goto("/");
  await bot.close();

  await page.reload();
  await expect(statValue(page, /^Page views, last/)).toHaveText(String(before.views + 4));
  // Same browser + network on the same day = one visitor, despite 4 page views.
  await expect(statValue(page, /^Visitors, last/)).toHaveText(String(before.visitors + 1));
  await expect(page.getByRole("rowheader", { name: "Courts & Solutions" })).toBeVisible();
});
