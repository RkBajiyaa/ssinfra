import { describe, expect, it } from "vitest";
import { isBot, normalizePath, referrerHost } from "@/lib/analytics/track";
import { dayRange } from "@/lib/analytics/report";
import { istDate } from "@/lib/request";

describe("normalizePath", () => {
  it("keeps known public pages and strips queries, hashes and trailing slashes", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/contact?service=padel#quote")).toBe("/contact");
    expect(normalizePath("/projects/")).toBe("/projects");
  });
  it("ignores admin, API and unknown paths so stats can't be bloated", () => {
    expect(normalizePath("/admin")).toBeNull();
    expect(normalizePath("/api/track")).toBeNull();
    expect(normalizePath("/random-404-spam")).toBeNull();
  });
});

describe("referrerHost", () => {
  it("returns external hosts without www", () => {
    expect(referrerHost("https://www.google.com/search?q=padel", "ssinfratech.in")).toBe("google.com");
  });
  it("ignores self-referrals and junk", () => {
    expect(referrerHost("https://ssinfratech.in/about", "ssinfratech.in")).toBeNull();
    expect(referrerHost("not a url", "x")).toBeNull();
    expect(referrerHost(undefined, "x")).toBeNull();
  });
});

describe("isBot", () => {
  it("filters crawlers, headless browsers and empty agents", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("Mozilla/5.0 HeadlessChrome/140.0")).toBe(true);
    expect(isBot("WhatsApp/2.23")).toBe(true);
  });
  it("lets ordinary browsers through", () => {
    expect(isBot("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36")).toBe(false);
  });
});

describe("IST dates", () => {
  it("rolls over at Indian midnight, not UTC", () => {
    expect(istDate(new Date("2026-10-24T18:29:00Z"))).toBe("2026-10-24");
    expect(istDate(new Date("2026-10-24T18:31:00Z"))).toBe("2026-10-25");
  });
  it("builds an inclusive, oldest-first range", () => {
    const r = dayRange(7, new Date("2026-10-25T06:00:00Z"));
    expect(r).toHaveLength(7);
    expect(r[0]).toBe("2026-10-19");
    expect(r[6]).toBe("2026-10-25");
  });
});
