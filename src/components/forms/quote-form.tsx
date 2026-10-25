"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { submitLead } from "@/lib/leads/actions";
import { leadFieldsSchema, type LeadFieldName } from "@/lib/leads/schema";
import { BUDGETS, COURT_TYPES, INDIAN_STATES, SERVICES, SITE_TYPES, TIMELINES, type ServiceId } from "@/lib/domain";
import { readAttribution } from "@/components/site/tracker";
import { buttonClass } from "@/components/ui/button";
import { CheckIcon, ChevronIcon } from "@/components/ui/icons";
import { site } from "@/config/site";

type Values = Record<LeadFieldName, string>;
type Errors = Partial<Record<LeadFieldName, string>>;

const EMPTY: Values = {
  fullName: "",
  phone: "",
  requestedService: "",
  projectCity: "",
  projectState: "",
  businessName: "",
  email: "",
  numberOfCourts: "",
  courtType: "",
  siteType: "",
  flooringRequirements: "",
  estimatedBudget: "",
  expectedTimeline: "",
  projectDetails: "",
};

const FIELD_ORDER: LeadFieldName[] = [
  "fullName", "phone", "requestedService", "projectCity", "projectState",
  "numberOfCourts", "courtType", "siteType", "flooringRequirements",
  "businessName", "email", "estimatedBudget", "expectedTimeline", "projectDetails",
];

const OPTIONAL_EXTRAS: LeadFieldName[] = ["businessName", "email", "estimatedBudget", "expectedTimeline", "projectDetails"];

function isServiceId(v: string | null): v is ServiceId {
  return SERVICES.some((s) => s.id === v);
}

function validateField(name: LeadFieldName, value: string): string | undefined {
  const result = leadFieldsSchema.shape[name].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function QuoteForm({ packages }: { packages: { slug: string; name: string }[] }) {
  const params = useSearchParams();
  const formId = useId();
  const [values, setValues] = useState<Values>(() => {
    const s = params.get("service");
    return { ...EMPTY, requestedService: isServiceId(s) ? s : "" };
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ leadNumber: string | null } | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [pending, startTransition] = useTransition();

  const packageSlug = params.get("package") ?? "";
  const selectedPackage = packages.find((p) => p.slug === packageSlug);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(0);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const service = values.requestedService;
  const showCourts = service === "padel" || service === "squash" || service === "multiple";
  const showCourtType = service === "padel" || service === "multiple";
  const showSite = service === "padel" || service === "multiple";
  const showFlooring = service === "flooring" || service === "multiple";

  function set(name: LeadFieldName, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    // Clear an error as soon as the field becomes valid; don't nag mid-typing otherwise.
    if (errors[name] && !validateField(name, value)) {
      setErrors((e) => ({ ...e, [name]: undefined }));
    }
  }

  function blur(name: LeadFieldName) {
    const msg = validateField(name, values[name]);
    setErrors((e) => ({ ...e, [name]: msg }));
  }

  function focusFirstError(errs: Errors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (!first) return;
    if (OPTIONAL_EXTRAS.includes(first)) setShowExtras(true);
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);

    // Hidden conditional fields shouldn't be sent or block submission.
    const submitted: Values = {
      ...values,
      numberOfCourts: showCourts ? values.numberOfCourts : "",
      courtType: showCourtType ? values.courtType : "",
      siteType: showSite ? values.siteType : "",
      flooringRequirements: showFlooring ? values.flooringRequirements : "",
    };

    const parsed = leadFieldsSchema.safeParse(submitted);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as LeadFieldName;
        errs[key] ??= issue.message;
      }
      setErrors(errs);
      focusFirstError(errs);
      return;
    }

    idempotencyKey.current ??= crypto.randomUUID();
    const fd = new FormData();
    for (const [k, v] of Object.entries(submitted)) fd.set(k, v);
    const attribution = readAttribution();
    fd.set("idempotencyKey", idempotencyKey.current);
    fd.set("sourcePage", window.location.pathname);
    fd.set("packageSlug", selectedPackage ? selectedPackage.slug : "");
    fd.set("entryPage", attribution.entryPage ?? "");
    fd.set("referrer", attribution.referrer ?? "");
    fd.set("utmSource", attribution.utmSource ?? "");
    fd.set("utmMedium", attribution.utmMedium ?? "");
    fd.set("utmCampaign", attribution.utmCampaign ?? "");
    fd.set("website", (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "");
    fd.set("elapsedMs", String(mountedAt.current ? Date.now() - mountedAt.current : 0));

    startTransition(async () => {
      try {
        const result = await submitLead(fd);
        if (result.status === "success") {
          setSuccess({ leadNumber: result.leadNumber });
          setValues({ ...EMPTY });
          setErrors({});
          idempotencyKey.current = null;
        } else if (result.status === "invalid") {
          setErrors(result.fieldErrors as Errors);
          focusFirstError(result.fieldErrors as Errors);
        } else {
          setFormError(result.message);
        }
      } catch {
        // Network failure: keep the same idempotency key so a retry can't duplicate the lead.
        setFormError(
          `We couldn't reach the server. Check your connection and submit again, or call us on ${site.phone.display}.`,
        );
      }
    });
  }

  if (success) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="border-2 border-ok/40 bg-white p-6 outline-none sm:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-ok/10 text-ok">
          <CheckIcon className="size-6" />
        </span>
        <h3 className="mt-4 font-display text-[2rem] leading-tight font-bold text-navy">Enquiry received</h3>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-char">
          Thank you for contacting SS Infratech. Your project enquiry has been received. Our team will review the
          details and contact you to discuss the next steps.
        </p>
        {success.leadNumber && (
          <p className="mt-4 text-muted">
            Your reference: <strong className="font-semibold text-navy">{success.leadNumber}</strong>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSuccess(null);
            mountedAt.current = Date.now();
          }}
          className={buttonClass("outline", "md", "mt-6")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const field = (name: LeadFieldName) => ({
    id: `${formId}-${name}`,
    name,
    value: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${formId}-${name}-error` : undefined,
    onBlur: () => blur(name),
  });

  const inputClass = (name: LeadFieldName) =>
    `mt-1.5 block min-h-12 w-full rounded-[3px] border bg-white px-3.5 text-base text-char placeholder:text-steel focus:outline-2 focus:outline-offset-0 focus:outline-turf ${
      errors[name] ? "border-danger" : "border-line hover:border-steel"
    }`;

  const extrasFilled = OPTIONAL_EXTRAS.filter((f) => values[f]).length;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={pending} className="grid gap-6">
      {selectedPackage && (
        <p className="border-l-2 border-turf bg-turf-wash px-4 py-3 text-[0.95rem] text-navy">
          Enquiring about: <strong className="font-semibold">{selectedPackage.name}</strong>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="fullName" formId={formId} error={errors.fullName} required>
          <input {...field("fullName")} type="text" autoComplete="name" maxLength={100} onChange={(e) => set("fullName", e.target.value)} className={inputClass("fullName")} />
        </Field>
        <Field label="Mobile number" name="phone" formId={formId} error={errors.phone} required hint="10-digit Indian mobile, or international with +">
          <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={20} onChange={(e) => set("phone", e.target.value)} className={inputClass("phone")} />
        </Field>
      </div>

      <fieldset aria-describedby={errors.requestedService ? `${formId}-requestedService-error` : undefined}>
        <legend className="text-[0.95rem] font-semibold text-navy">
          Service you need <span className="text-danger" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <label
              key={s.id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[3px] border px-3.5 py-2.5 text-[0.95rem] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-turf ${
                values.requestedService === s.id ? "border-navy bg-navy/[0.04] font-medium text-navy" : "border-line hover:border-steel"
              } ${s.id === "padel" ? "sm:col-span-2" : ""}`}
            >
              <input
                type="radio"
                name="requestedService"
                value={s.id}
                checked={values.requestedService === s.id}
                onChange={() => set("requestedService", s.id)}
                className="size-4 accent-navy"
              />
              {s.label}
            </label>
          ))}
        </div>
        <FieldError id={`${formId}-requestedService-error`} error={errors.requestedService} />
      </fieldset>

      {(showCourts || showSite || showFlooring) && (
        <div className="grid gap-5 border-l-2 border-line pl-4 sm:grid-cols-2 sm:pl-5">
          {showCourts && (
            <Field label="Number of courts" name="numberOfCourts" formId={formId} error={errors.numberOfCourts}>
              <input {...field("numberOfCourts")} type="number" inputMode="numeric" min={1} max={50} onChange={(e) => set("numberOfCourts", e.target.value)} className={inputClass("numberOfCourts")} />
            </Field>
          )}
          {showCourtType && (
            <Field label="Preferred court type" name="courtType" formId={formId} error={errors.courtType}>
              <select {...field("courtType")} onChange={(e) => set("courtType", e.target.value)} className={inputClass("courtType")}>
                <option value="">Select</option>
                {COURT_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          )}
          {showSite && (
            <Field label="Indoor or outdoor" name="siteType" formId={formId} error={errors.siteType}>
              <select {...field("siteType")} onChange={(e) => set("siteType", e.target.value)} className={inputClass("siteType")}>
                <option value="">Select</option>
                {SITE_TYPES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
          )}
          {showFlooring && (
            <Field label="Flooring requirements" name="flooringRequirements" formId={formId} error={errors.flooringRequirements} className="sm:col-span-2" hint="Activity, approximate area, existing floor">
              <input {...field("flooringRequirements")} type="text" maxLength={500} onChange={(e) => set("flooringRequirements", e.target.value)} className={inputClass("flooringRequirements")} />
            </Field>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Project city" name="projectCity" formId={formId} error={errors.projectCity} required>
          <input {...field("projectCity")} type="text" autoComplete="address-level2" maxLength={80} onChange={(e) => set("projectCity", e.target.value)} className={inputClass("projectCity")} />
        </Field>
        <Field label="Project state" name="projectState" formId={formId} error={errors.projectState} required>
          <input {...field("projectState")} type="text" list={`${formId}-states`} autoComplete="address-level1" maxLength={80} onChange={(e) => set("projectState", e.target.value)} className={inputClass("projectState")} />
          <datalist id={`${formId}-states`}>
            {INDIAN_STATES.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
      </div>

      <div className="border-t border-line pt-5">
        <button
          type="button"
          aria-expanded={showExtras}
          aria-controls={`${formId}-extras`}
          onClick={() => setShowExtras((s) => !s)}
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-navy"
        >
          <ChevronIcon className={`size-5 text-turf transition-transform ${showExtras ? "rotate-90" : ""}`} />
          Add more project details
          <span className="font-normal text-muted">(optional{extrasFilled ? `, ${extrasFilled} added` : ""})</span>
        </button>
        <div id={`${formId}-extras`} hidden={!showExtras} className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Business or organisation" name="businessName" formId={formId} error={errors.businessName}>
            <input {...field("businessName")} type="text" autoComplete="organization" maxLength={120} onChange={(e) => set("businessName", e.target.value)} className={inputClass("businessName")} />
          </Field>
          <Field label="Email" name="email" formId={formId} error={errors.email}>
            <input {...field("email")} type="email" autoComplete="email" maxLength={160} onChange={(e) => set("email", e.target.value)} className={inputClass("email")} />
          </Field>
          <Field label="Estimated budget" name="estimatedBudget" formId={formId} error={errors.estimatedBudget}>
            <select {...field("estimatedBudget")} onChange={(e) => set("estimatedBudget", e.target.value)} className={inputClass("estimatedBudget")}>
              <option value="">Select</option>
              {BUDGETS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Expected timeline" name="expectedTimeline" formId={formId} error={errors.expectedTimeline}>
            <select {...field("expectedTimeline")} onChange={(e) => set("expectedTimeline", e.target.value)} className={inputClass("expectedTimeline")}>
              <option value="">Select</option>
              {TIMELINES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Anything else about the project" name="projectDetails" formId={formId} error={errors.projectDetails} className="sm:col-span-2">
            <textarea {...field("projectDetails")} rows={4} maxLength={2000} onChange={(e) => set("projectDetails", e.target.value)} className={`${inputClass("projectDetails")} py-3`} />
          </Field>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {formError && (
        <div role="alert" className="border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[0.95rem] text-danger">
          <p>{formError}</p>
          <a href={`tel:${site.phone.e164}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-navy underline underline-offset-2">
            Call {site.phone.display}
          </a>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "sm:min-w-56")}>
          {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {pending ? "Sending enquiry…" : "Send enquiry"}
        </button>
        <p className="text-sm text-muted">
          Fields marked <span className="text-danger">*</span> are required. See our{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-navy">privacy policy</a>.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  formId,
  error,
  required,
  hint,
  className = "",
  children,
}: {
  label: string;
  name: LeadFieldName;
  formId: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={`${formId}-${name}`} className="text-[0.95rem] font-semibold text-navy">
        {label}
        {required && (
          <>
            <span className="text-danger" aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
      <FieldError id={`${formId}-${name}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-danger">
      {error}
    </p>
  );
}

export function QuoteFormSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-20 rounded-[3px] bg-paper" />
        <div className="h-20 rounded-[3px] bg-paper" />
      </div>
      <div className="h-44 rounded-[3px] bg-paper" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="h-20 rounded-[3px] bg-paper" />
        <div className="h-20 rounded-[3px] bg-paper" />
      </div>
      <div className="h-13 w-56 rounded-[3px] bg-paper" />
    </div>
  );
}
