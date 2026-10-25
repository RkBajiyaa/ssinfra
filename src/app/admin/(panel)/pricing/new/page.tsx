import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { Skeleton } from "@/components/admin/ui";
import { ChevronIcon } from "@/components/ui/icons";
import { PackageForm } from "../package-form";

export const metadata: Metadata = { title: "New package" };

async function Guarded() {
  await requireAdmin();
  return <PackageForm pkg={null} />;
}

export default function NewPackagePage() {
  return (
    <>
      <Link href="/admin/pricing" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-navy">
        <ChevronIcon className="size-4 rotate-180" />
        All packages
      </Link>
      <h1 className="mt-2 mb-6 font-display text-[2.4rem] leading-none font-bold text-navy">New package</h1>
      <Suspense fallback={<Skeleton className="h-[40rem]" />}>
        <Guarded />
      </Suspense>
    </>
  );
}
