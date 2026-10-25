import { z } from "zod";
import {
  BUDGETS,
  COURT_TYPES,
  SERVICE_IDS,
  SITE_TYPES,
  TIMELINES,
} from "@/lib/domain";
import { normalizePhone } from "@/lib/phone";

/** Empty strings from untouched form inputs become undefined. */
const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Strips control characters (keeps newlines/tabs) so stored text is safe to render and export. */
const cleanText = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `Enter ${label}` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(2, { error: `Enter ${label}` })
        .max(max, { error: `Keep ${label} under ${max} characters` }),
    );

const optionalText = (max: number) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform(cleanText)
      .pipe(z.string().max(max, { error: `Keep this under ${max} characters` }))
      .optional(),
  );

const optionalEnum = <T extends readonly { id: string }[]>(list: T) =>
  z.preprocess(
    blankToUndefined,
    z.enum(list.map((o) => o.id) as [T[number]["id"], ...T[number]["id"][]]).optional(),
  );

/** Visitor-entered fields. Shared by the client (inline errors) and the server (authoritative). */
export const leadFieldsSchema = z.object({
  fullName: requiredText("your full name", 100),
  phone: z
    .string({ error: "Enter your mobile number" })
    .transform((v, ctx) => {
      const normalized = normalizePhone(v);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 10-digit Indian mobile, or an international number starting with +",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  requestedService: z.enum(SERVICE_IDS, { error: "Choose the service you need" }),
  projectCity: requiredText("the project city", 80),
  projectState: requiredText("the project state", 80),

  businessName: optionalText(120),
  email: z.preprocess(
    blankToUndefined,
    z.email({ error: "Enter a valid email address, or leave it blank" }).max(160).optional(),
  ),
  numberOfCourts: z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: "Enter a number of courts" })
      .int({ error: "Enter a whole number" })
      .min(1, { error: "Enter at least 1" })
      .max(50, { error: "For more than 50 courts, mention it in the details" })
      .optional(),
  ),
  courtType: optionalEnum(COURT_TYPES),
  siteType: optionalEnum(SITE_TYPES),
  flooringRequirements: optionalText(500),
  estimatedBudget: optionalEnum(BUDGETS),
  expectedTimeline: optionalEnum(TIMELINES),
  projectDetails: optionalText(2000),
});

export type LeadFields = z.output<typeof leadFieldsSchema>;
export type LeadFieldName = keyof z.input<typeof leadFieldsSchema>;

/** Non-visitor metadata posted alongside the fields. All of it is optional and length-capped. */
export const leadMetaSchema = z.object({
  idempotencyKey: z.uuid({ error: "Reload the page and try again" }),
  sourcePage: optionalText(200),
  packageSlug: optionalText(80),
  entryPage: optionalText(200),
  referrer: optionalText(200),
  utmSource: optionalText(100),
  utmMedium: optionalText(100),
  utmCampaign: optionalText(100),
  /** Honeypot: real visitors never see or fill this. */
  website: z.string().max(500).optional(),
  /** Milliseconds the form was open before submitting. */
  elapsedMs: z.coerce.number().int().nonnegative().max(86_400_000).optional(),
});

export type LeadMeta = z.output<typeof leadMetaSchema>;

export const LEAD_FIELD_NAMES = Object.keys(leadFieldsSchema.shape) as LeadFieldName[];
export const LEAD_META_NAMES = Object.keys(leadMetaSchema.shape) as (keyof LeadMeta)[];
