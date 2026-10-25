import { describe, expect, it } from "vitest";
import { leadFieldsSchema, leadMetaSchema } from "@/lib/leads/schema";
import { packageInputSchema, priceLine } from "@/lib/packages/schema";

const validLead = {
  fullName: "Asha Verma",
  phone: "98290 12345",
  requestedService: "padel",
  projectCity: "Jaipur",
  projectState: "Rajasthan",
};

describe("leadFieldsSchema", () => {
  it("accepts the five required fields alone and normalises the phone", () => {
    const r = leadFieldsSchema.safeParse(validLead);
    expect(r.success).toBe(true);
    expect(r.data?.phone).toBe("+919829012345");
    expect(r.data?.email).toBeUndefined();
  });

  it("treats blank optional fields as absent", () => {
    const r = leadFieldsSchema.safeParse({ ...validLead, email: "", numberOfCourts: "", courtType: "", projectDetails: "  " });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("email", "");
    expect(r.data?.numberOfCourts).toBeUndefined();
  });

  it("reports each missing required field", () => {
    const r = leadFieldsSchema.safeParse({});
    expect(r.success).toBe(false);
    const fields = new Set(r.error!.issues.map((i) => i.path[0]));
    for (const f of ["fullName", "phone", "requestedService", "projectCity", "projectState"]) expect(fields).toContain(f);
  });

  it("validates email only when supplied", () => {
    expect(leadFieldsSchema.safeParse({ ...validLead, email: "nope" }).success).toBe(false);
    expect(leadFieldsSchema.safeParse({ ...validLead, email: "a@b.in" }).success).toBe(true);
  });

  it("rejects unknown enum values and silly court counts", () => {
    expect(leadFieldsSchema.safeParse({ ...validLead, requestedService: "tennis" }).success).toBe(false);
    expect(leadFieldsSchema.safeParse({ ...validLead, courtType: "gold" }).success).toBe(false);
    expect(leadFieldsSchema.safeParse({ ...validLead, numberOfCourts: "0" }).success).toBe(false);
    expect(leadFieldsSchema.safeParse({ ...validLead, numberOfCourts: "2.5" }).success).toBe(false);
    expect(leadFieldsSchema.safeParse({ ...validLead, numberOfCourts: "4" }).data?.numberOfCourts).toBe(4);
  });

  it("strips control characters and enforces length limits", () => {
    const r = leadFieldsSchema.safeParse({ ...validLead, fullName: "Asha\u0000 Verma\u0007" });
    expect(r.data?.fullName).toBe("Asha Verma");
    expect(leadFieldsSchema.safeParse({ ...validLead, projectDetails: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("leadMetaSchema", () => {
  it("requires a UUID idempotency key", () => {
    expect(leadMetaSchema.safeParse({ idempotencyKey: "abc" }).success).toBe(false);
    expect(leadMetaSchema.safeParse({ idempotencyKey: "3f1c6a52-6a4b-4f7e-9d38-2a9a0b2f1c11" }).success).toBe(true);
  });
});

const basePackage = {
  name: "Padel Court – Standard",
  slug: "padel-standard",
  serviceCategory: "padel",
  shortDescription: "",
  includedFeatures: "Steel frame\n\n  Glass enclosure  \n",
  exclusions: "",
  optionalFeatures: "",
  priceAmount: "",
  priceUnit: "",
  ctaLabel: "Request a Quote",
  displayOrder: "10",
  isActive: "on",
};

describe("packageInputSchema", () => {
  it("splits feature lines and drops blanks", () => {
    const r = packageInputSchema.parse({ ...basePackage, priceMode: "contact" });
    expect(r.includedFeatures).toEqual(["Steel frame", "Glass enclosure"]);
    expect(r.isActive).toBe(true);
  });

  it("requires an amount for starting-from and fixed modes", () => {
    expect(packageInputSchema.safeParse({ ...basePackage, priceMode: "starting_from" }).success).toBe(false);
    expect(packageInputSchema.safeParse({ ...basePackage, priceMode: "fixed", priceAmount: "-5" }).success).toBe(false);
    const ok = packageInputSchema.parse({ ...basePackage, priceMode: "fixed", priceAmount: "₹15,00,000", priceUnit: "per court" });
    expect(ok.priceAmount).toBe(1_500_000);
  });

  it("discards a price the chosen mode wouldn't display", () => {
    const r = packageInputSchema.parse({ ...basePackage, priceMode: "contact", priceAmount: "900000", priceUnit: "per court" });
    expect(r.priceAmount).toBeNull();
    expect(r.priceUnit).toBeNull();
  });

  it("rejects malformed slugs", () => {
    expect(packageInputSchema.safeParse({ ...basePackage, priceMode: "quote", slug: "Bad Slug!" }).success).toBe(false);
  });
});

describe("priceLine", () => {
  it("shows a figure only in starting-from and fixed modes", () => {
    expect(priceLine({ priceMode: "contact", priceAmount: 100, priceUnit: null }).amount).toBeNull();
    expect(priceLine({ priceMode: "quote", priceAmount: 100, priceUnit: null }).amount).toBeNull();
    expect(priceLine({ priceMode: "starting_from", priceAmount: 1500000, priceUnit: "per court" })).toEqual({
      label: "Starting from",
      amount: "₹15,00,000",
      unit: "per court",
    });
    expect(priceLine({ priceMode: "fixed", priceAmount: 250000, priceUnit: null }).label).toBe("Price");
  });

  it("falls back to contact-for-pricing if a priced mode has no amount", () => {
    expect(priceLine({ priceMode: "fixed", priceAmount: null, priceUnit: null })).toEqual({
      label: "Contact for pricing",
      amount: null,
      unit: null,
    });
  });
});
