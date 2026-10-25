import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, whatsappDigits } from "@/lib/phone";

describe("normalizePhone", () => {
  it.each([
    ["9672567423", "+919672567423"],
    ["09672567423", "+919672567423"],
    ["096725 67423", "+919672567423"],
    ["+91 96725 67423", "+919672567423"],
    ["919672567423", "+919672567423"],
    ["0091 9672567423", "+919672567423"],
    ["(967) 256-7423", "+919672567423"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+1 415 555 2671", "+14155552671"],
  ])("accepts %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "",
    "12345",
    "5672567423", // Indian mobiles start 6-9
    "+91 12345 67890",
    "967256742a",
    "+0123456789",
    "+1234567", // too short
    "+1234567890123456", // too long
    "96725674231",
  ])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("display helpers", () => {
  it("formats Indian numbers for reading", () => {
    expect(formatPhone("+919672567423")).toBe("+91 96725 67423");
    expect(formatPhone("+442079460958")).toBe("+442079460958");
  });
  it("never doubles the country code for wa.me", () => {
    expect(whatsappDigits("+919672567423")).toBe("919672567423");
  });
});
