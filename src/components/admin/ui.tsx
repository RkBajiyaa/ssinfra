import type { ReactNode } from "react";
import { statusLabel, type LeadStatus } from "@/lib/domain";
import type { FirebaseFailureKind } from "@/lib/firebase/errors";

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-[2.4rem] leading-none font-bold text-navy">{title}</h1>
      {children}
    </div>
  );
}

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-brass/15 text-[#7a5a24] ring-brass/40",
  contacted: "bg-turf-wash text-turf-deep ring-turf/30",
  quotation_sent: "bg-navy/8 text-navy ring-navy/25",
  won: "bg-ok/10 text-ok ring-ok/30",
  lost: "bg-char/5 text-muted ring-char/15",
};

/** Status is always shown as text, never colour alone. */
export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateOnly = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}
export function formatDay(iso: string) {
  return dateOnly.format(new Date(iso));
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="font-semibold text-navy">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const NOTICE: Partial<Record<FirebaseFailureKind, string>> = {
  not_configured: "Firebase isn\u2019t configured on the server yet. Add the variables listed in .env.example.",
  invalid_config: "The Firebase configuration is invalid. The server log names the variable to fix.",
  auth_failed: "Firebase rejected the server\u2019s service-account credentials. Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
  permission_denied: "The service account isn\u2019t allowed to use Firestore. Check its IAM role in Google Cloud.",
  quota_exceeded: "The Firebase usage quota is exhausted for now. Data will load again when it resets.",
  not_found: "The Firestore database wasn\u2019t found. Create it in the Firebase console.",
};

export function SetupNotice({ kind = "unknown" }: { kind?: FirebaseFailureKind }) {
  return (
    <div role="alert" className="border-l-2 border-warn bg-warn/[0.07] px-4 py-3 text-sm text-char">
      {NOTICE[kind] ?? "The database isn\u2019t reachable right now. Reload in a moment; details are in the server log."}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-[3px] bg-line-soft ${className}`} />;
}
