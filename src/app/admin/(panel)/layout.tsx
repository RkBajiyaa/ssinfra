import { Suspense } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { getAdmin } from "@/lib/auth/session";
import { countNewLeads } from "@/lib/leads/repo";
import { logFirebaseError } from "@/lib/firebase/errors";
import { AdminNav, SignOutButton } from "./admin-nav";
import { PwaRegister } from "./pwa";

async function NewLeadBadge() {
  // Fallback indicator for when push is off: unread-style count of "New" leads.
  if (!(await getAdmin())) return null;
  const count = await countNewLeads().catch((err: unknown) => {
    logFirebaseError("admin badge", err);
    return 0;
  });
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-brass px-1.5 text-[0.7rem] leading-5 font-bold text-white">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> new</span>
    </span>
  );
}

async function AccountEmail() {
  const admin = await getAdmin();
  return <span className="truncate">{admin?.email ?? ""}</span>;
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  const badge = (
    <Suspense fallback={null}>
      <NewLeadBadge />
    </Suspense>
  );
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="hidden flex-col bg-navy p-4 text-white lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-2">
          <LogoMark className="size-9" />
          <span className="font-display text-xl leading-none font-bold">Admin SS Infra</span>
        </Link>
        <div className="mt-8">
          {/* usePathname() is request data on dynamic routes, so the nav streams in. */}
          <Suspense fallback={<div className="h-36" />}>
            <AdminNav badge={badge} />
          </Suspense>
        </div>
        <div className="mt-auto grid gap-1 border-t border-white/10 pt-4 text-sm text-white/60">
          <Suspense fallback={<span>&nbsp;</span>}>
            <AccountEmail />
          </Suspense>
          <a href="/" target="_blank" rel="noopener" className="min-h-9 py-2 hover:text-white">
            View website
          </a>
          <SignOutButton className="min-h-9 text-left hover:text-white" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Link href="/admin" className="flex min-h-14 items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-display text-lg font-bold text-navy">Admin SS Infra</span>
          </Link>
          <SignOutButton className="min-h-11 px-2 text-sm font-semibold text-muted" />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
      <div className="lg:hidden">
        <Suspense fallback={null}>
          <AdminNav badge={badge} />
        </Suspense>
      </div>
      <PwaRegister />
    </div>
  );
}
