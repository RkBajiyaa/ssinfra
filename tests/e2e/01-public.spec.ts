import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", h1: /built strong/i },
  { path: "/courts-solutions", h1: /courts & solutions/i },
  { path: "/projects", h1: /projects & gallery/i },
  { path: "/contact", h1: /contact ss infratech/i },
  { path: "/about", h1: /about ss infratech/i },
  { path: "/privacy", h1: /privacy policy/i },
];

test("all public pages load with unique titles and one h1", async ({ page }) => {
  const titles = new Set<string>();
  for (const p of pages) {
    const res = await page.goto(p.path);
    expect(res?.status(), p.path).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(p.h1);
    titles.add(await page.title());
    expect(await page.locator('link[rel="canonical"]').count(), `${p.path} canonical`).toBe(1);
  }
  expect(titles.size).toBe(pages.length);
});

test("phone links use E.164 and WhatsApp stays hidden until verified", async ({ page }) => {
  await page.goto("/contact");
  const tel = page.locator('a[href^="tel:"]').first();
  await expect(tel).toHaveAttribute("href", "tel:+919672567423");
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
});

test("unknown pages return 404", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
});

test("sitemap and robots are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/courts-solutions");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /admin");
});

for (const width of [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const p of pages) {
      await page.goto(p.path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${p.path} @ ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test("mobile menu opens, traps Escape and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await menu.getByRole("link", { name: "Projects & Gallery" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(menu).toBeHidden();
});

test("gallery filter and lightbox work by keyboard", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Squash Courts", exact: true }).click();
  await expect(page.getByRole("button", { name: /squash court with glass back wall/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /multi-court padel facility/i })).toHaveCount(0);
  await page.getByRole("button", { name: /squash court with glass back wall/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("service CTAs carry the selection into the quote form", async ({ page }) => {
  await page.goto("/courts-solutions");
  await page.getByRole("link", { name: "Request a quote for squash courts" }).click();
  await expect(page).toHaveURL(/service=squash/);
  await expect(page.getByRole("radio", { name: "Squash Court Solutions" })).toBeChecked();
});
