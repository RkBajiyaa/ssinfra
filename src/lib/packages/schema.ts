import { z } from "zod";

export const PRICE_MODES = [
  { id: "contact", label: "Contact for pricing", needsAmount: false },
  { id: "starting_from", label: "Starting from", needsAmount: true },
  { id: "fixed", label: "Fixed displayed price", needsAmount: true },
  { id: "quote", label: "Custom quotation", needsAmount: false },
] as const;
export type PriceMode = (typeof PRICE_MODES)[number]["id"];
const PRICE_MODE_IDS = PRICE_MODES.map((m) => m.id) as [PriceMode, ...PriceMode[]];

export const PACKAGE_CATEGORIES = [
  { id: "padel", label: "Padel courts" },
  { id: "squash", label: "Squash courts" },
  { id: "flooring", label: "Wooden sports flooring" },
] as const;
export type PackageCategory = (typeof PACKAGE_CATEGORIES)[number]["id"];
const CATEGORY_IDS = PACKAGE_CATEGORIES.map((c) => c.id) as [PackageCategory, ...PackageCategory[]];

export type ServicePackage = {
  id: string;
  slug: string;
  name: string;
  serviceCategory: PackageCategory;
  shortDescription: string;
  includedFeatures: string[];
  exclusions: string[];
  optionalFeatures: string[];
  priceMode: PriceMode;
  priceAmount: number | null;
  priceCurrency: "INR";
  priceUnit: string | null;
  ctaLabel: string;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string | null;
};

/** One item per line in the admin textarea -> trimmed, de-blanked list. */
const lineList = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(160, { error: "Keep each line under 160 characters" })).max(30, { error: "Up to 30 lines" }));

export const packageInputSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Enter a package name" }).max(80),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "Use lowercase letters, numbers and hyphens" })
      .max(60),
    serviceCategory: z.enum(CATEGORY_IDS, { error: "Choose a category" }),
    shortDescription: z.string().trim().max(300, { error: "Keep it under 300 characters" }).default(""),
    includedFeatures: lineList,
    exclusions: lineList,
    optionalFeatures: lineList,
    priceMode: z.enum(PRICE_MODE_IDS, { error: "Choose how the price is shown" }),
    priceAmount: z.preprocess(
      (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(/[,\s₹]/g, "")) : v),
      z.coerce
        .number({ error: "Enter the price as a number" })
        .positive({ error: "Price must be above zero" })
        .max(1_000_000_000, { error: "That price looks too large" })
        .optional(),
    ),
    priceUnit: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(40).optional(),
    ),
    ctaLabel: z.string().trim().min(2, { error: "Enter button text" }).max(40),
    displayOrder: z.coerce.number().int().min(0).max(999).default(0),
    isActive: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  })
  .superRefine((v, ctx) => {
    const mode = PRICE_MODES.find((m) => m.id === v.priceMode);
    if (mode?.needsAmount && v.priceAmount === undefined) {
      ctx.addIssue({ code: "custom", path: ["priceAmount"], message: "Enter a price for this display mode" });
    }
  })
  // Never keep a price the chosen mode wouldn't show, so it can't leak later.
  .transform((v) => {
    const mode = PRICE_MODES.find((m) => m.id === v.priceMode)!;
    return {
      ...v,
      priceAmount: mode.needsAmount ? (v.priceAmount ?? null) : null,
      priceUnit: mode.needsAmount ? (v.priceUnit ?? null) : null,
    };
  });

export type PackageInput = z.output<typeof packageInputSchema>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** The public price line for a package. Returns null when no figure should appear. */
export function priceLine(p: Pick<ServicePackage, "priceMode" | "priceAmount" | "priceUnit">): {
  label: string;
  amount: string | null;
  unit: string | null;
} {
  switch (p.priceMode) {
    case "starting_from":
      if (p.priceAmount == null) return { label: "Contact for pricing", amount: null, unit: null };
      return { label: "Starting from", amount: inr.format(p.priceAmount), unit: p.priceUnit };
    case "fixed":
      if (p.priceAmount == null) return { label: "Contact for pricing", amount: null, unit: null };
      return { label: "Price", amount: inr.format(p.priceAmount), unit: p.priceUnit };
    case "quote":
      return { label: "Custom quotation", amount: null, unit: null };
    default:
      return { label: "Contact for pricing", amount: null, unit: null };
  }
}
