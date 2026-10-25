import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { logFirebaseError } from "@/lib/firebase/errors";
import { getLead } from "@/lib/leads/repo";
import { BUDGETS, COURT_TYPES, SITE_TYPES, TIMELINES, optionLabel, serviceLabel } from "@/lib/domain";
import { formatPhone, whatsappDigits } from "@/lib/phone";
import { Panel, SetupNotice, Skeleton, StatusBadge, formatDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { ChevronIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { NotesForm, StatusForm } from "./lead-forms";

export const metadata: Metadata = { title: "Lead" };

export default function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  return (
    <>
      <Link href="/admin/leads" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-navy">
        <ChevronIcon className="size-4 rotate-180" />
        All leads
      </Link>
      <Suspense fallback={<Skeleton className="mt-4 h-96" />}>
        <LeadDetail params={params} />
      </Suspense>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words text-char">{value}</dd>
    </div>
  );
}

async function LeadDetail({ params }: { params: PageProps<"/admin/leads/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  let lead;
  try {
    lead = await getLead(id);
  } catch (err) {
    return <div className="mt-4"><SetupNotice kind={logFirebaseError("admin lead", err)} /></div>;
  }
  if (!lead) notFound();

  const a = lead.attribution;
  const waMessage = `Hello ${lead.fullName}, this is SS Infratech regarding your ${serviceLabel(lead.requestedService).toLowerCase()} enquiry (${lead.leadNumber}).`;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[2.2rem] leading-tight font-bold break-words text-navy">{lead.fullName}</h1>
          <p className="mt-1 text-sm text-muted">
            {lead.leadNumber}, received {formatDateTime(lead.createdAt)}
          </p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a href={`tel:${lead.phone}`} className={buttonClass("primary", "lg")}>
          <PhoneIcon className="size-5" />
          Call
        </a>
        <a
          href={`https://wa.me/${whatsappDigits(lead.phone)}?text=${encodeURIComponent(waMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "lg")}
        >
          <WhatsAppIcon className="size-5 text-[#128c4b]" />
          WhatsApp
        </a>
        {lead.email && (
          <a href={`mailto:${lead.email}`} className={buttonClass("outline", "lg", "col-span-2 sm:col-span-1")}>
            <MailIcon className="size-5" />
            Email
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-6">
          <Panel title="Enquiry">
            <dl className="-my-2.5 divide-y divide-line-soft">
              <Row label="Mobile" value={formatPhone(lead.phone)} />
              <Row label="Email" value={lead.email} />
              <Row label="Business" value={lead.businessName} />
              <Row label="Service" value={serviceLabel(lead.requestedService)} />
              <Row label="Package" value={lead.packageSlug} />
              <Row label="Number of courts" value={lead.numberOfCourts} />
              <Row label="Court type" value={optionLabel(COURT_TYPES, lead.courtType)} />
              <Row label="Indoor / outdoor" value={optionLabel(SITE_TYPES, lead.siteType)} />
              <Row label="Flooring" value={lead.flooringRequirements} />
              <Row label="Project location" value={`${lead.projectCity}, ${lead.projectState}`} />
              <Row label="Budget" value={optionLabel(BUDGETS, lead.estimatedBudget)} />
              <Row label="Timeline" value={optionLabel(TIMELINES, lead.expectedTimeline)} />
            </dl>
            {lead.projectDetails && (
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="text-sm text-muted">Project details</h3>
                {/* Rendered as text: React escapes it, so submitted HTML can't run. */}
                <p className="mt-1 whitespace-pre-wrap break-words text-char">{lead.projectDetails}</p>
              </div>
            )}
          </Panel>

          <Panel title="Internal notes">
            <NotesForm id={lead.id} notes={lead.internalNotes} />
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <Panel title="Status">
            <StatusForm id={lead.id} status={lead.status} />
          </Panel>
          <Panel title="Source">
            <dl className="-my-2.5 divide-y divide-line-soft text-sm">
              <Row label="Form page" value={lead.sourcePage} />
              <Row label="First page visited" value={a.entryPage} />
              <Row label="Referrer" value={a.referrer} />
              <Row label="Campaign source" value={a.utmSource} />
              <Row label="Campaign medium" value={a.utmMedium} />
              <Row label="Campaign name" value={a.utmCampaign} />
              <Row label="Last updated" value={formatDateTime(lead.updatedAt)} />
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
