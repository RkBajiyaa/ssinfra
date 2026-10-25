"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const items = [
  { href: "/admin", label: "Dashboard", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" },
  { href: "/admin/leads", label: "Leads", icon: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 4.15a3.5 3.5 0 0 1 0 6.7" },
  { href: "/admin/pricing", label: "Pricing", icon: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01" },
] as const;

function active(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Sidebar on desktop, bottom tab bar on phones. `badge` shows the new-lead count. */
export function AdminNav({ badge }: { badge: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Admin" className="hidden lg:block">
        <ul className="grid gap-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active(pathname, it.href) ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[3px] px-3 font-medium ${
                  active(pathname, it.href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon d={it.icon} />
                {it.label}
                {it.href === "/admin/leads" && badge}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-3">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active(pathname, it.href) ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active(pathname, it.href) ? "text-turf" : "text-muted"
                }`}
              >
                <Icon d={it.icon} />
                {it.label}
                {it.href === "/admin/leads" && <span className="absolute top-2 left-[calc(50%+0.5rem)]">{badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch("/api/admin/session", { method: "DELETE" });
        } finally {
          router.replace("/admin/login");
          router.refresh();
        }
      }}
      className={className}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
