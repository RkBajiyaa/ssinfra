import type { LeadStatus } from "@/lib/domain";

/** A lead as the admin UI sees it: plain, serialisable values only. */
export type Lead = {
  id: string;
  leadNumber: string;
  fullName: string;
  phone: string;
  businessName: string | null;
  email: string | null;
  requestedService: string;
  numberOfCourts: number | null;
  courtType: string | null;
  siteType: string | null;
  flooringRequirements: string | null;
  projectCity: string;
  projectState: string;
  estimatedBudget: string | null;
  expectedTimeline: string | null;
  projectDetails: string | null;
  packageSlug: string | null;
  sourcePage: string | null;
  attribution: {
    entryPage: string | null;
    referrer: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
  status: LeadStatus;
  internalNotes: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type LeadListFilters = {
  q?: string;
  status?: LeadStatus;
  service?: string;
  from?: string; // YYYY-MM-DD (IST)
  to?: string; // YYYY-MM-DD (IST)
  sort: "newest" | "oldest";
  page: number;
};

export const LEADS_PAGE_SIZE = 20;
