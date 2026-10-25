/**
 * Shared vocabulary used by the public form, the lead store and the admin.
 * Keeping the ids stable matters: they are persisted in Firestore.
 */

export const SERVICES = [
  { id: "padel", label: "Padel Court Manufacturing & Installation", short: "Padel courts" },
  { id: "squash", label: "Squash Court Solutions", short: "Squash courts" },
  { id: "flooring", label: "Wooden Sports Flooring", short: "Sports flooring" },
  { id: "multiple", label: "Multiple Services", short: "Multiple" },
  { id: "other", label: "Other / Not Sure Yet", short: "Other" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
export const SERVICE_IDS = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export function serviceLabel(id: string): string {
  return SERVICES.find((s) => s.id === id)?.label ?? id;
}
export function serviceShort(id: string): string {
  return SERVICES.find((s) => s.id === id)?.short ?? id;
}

export const COURT_TYPES = [
  { id: "standard", label: "Standard" },
  { id: "panoramic", label: "Panoramic" },
  { id: "not_sure", label: "Not sure yet" },
] as const;
export type CourtTypeId = (typeof COURT_TYPES)[number]["id"];

export const SITE_TYPES = [
  { id: "indoor", label: "Indoor" },
  { id: "outdoor", label: "Outdoor" },
  { id: "not_sure", label: "Not sure yet" },
] as const;
export type SiteTypeId = (typeof SITE_TYPES)[number]["id"];

export const BUDGETS = [
  { id: "under_15l", label: "Under ₹15 lakh" },
  { id: "15l_30l", label: "₹15 – 30 lakh" },
  { id: "30l_60l", label: "₹30 – 60 lakh" },
  { id: "60l_plus", label: "Above ₹60 lakh" },
  { id: "undecided", label: "Not decided yet" },
] as const;
export type BudgetId = (typeof BUDGETS)[number]["id"];

export const TIMELINES = [
  { id: "asap", label: "As soon as possible" },
  { id: "1_3_months", label: "Within 1–3 months" },
  { id: "3_6_months", label: "Within 3–6 months" },
  { id: "6_plus_months", label: "6 months or later" },
  { id: "exploring", label: "Just exploring" },
] as const;
export type TimelineId = (typeof TIMELINES)[number]["id"];

export const LEAD_STATUSES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "quotation_sent", label: "Quotation Sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number]["id"];
export const LEAD_STATUS_IDS = LEAD_STATUSES.map((s) => s.id) as [LeadStatus, ...LeadStatus[]];

export function statusLabel(id: string): string {
  return LEAD_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function optionLabel(
  list: ReadonlyArray<{ id: string; label: string }>,
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  return list.find((o) => o.id === id)?.label ?? id;
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;
