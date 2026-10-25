import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { logFirebaseError } from "@/lib/firebase/errors";
import { getPackage } from "@/lib/packages/repo";
import { SetupNotice, Skeleton } from "@/components/admin/ui";
import { ChevronIcon } from "@/components/ui/icons";
import { PackageForm } from "../package-form";

export const metadata: Metadata = { title: "Edit package" };

export default function EditPackagePage({ params, searchParams }: PageProps<"/admin/pricing/[id]">) {
  return (
    <>
      <Link href="/admin/pricing" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-navy">
        <ChevronIcon className="size-4 rotate-180" />
        All packages
      </Link>
      <Suspense fallback={<Skeleton className="mt-4 h-[40rem]" />}>
        <EditPackage params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EditPackage({ params, searchParams }: Pick<PageProps<"/admin/pricing/[id]">, "params" | "searchParams">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  let pkg;
  try {
    pkg = await getPackage(id);
  } catch (err) {
    return <div className="mt-4"><SetupNotice kind={logFirebaseError("admin package", err)} /></div>;
  }
  if (!pkg) notFound();
  return (
    <>
      <h1 className="mt-2 mb-6 font-display text-[2.4rem] leading-none font-bold text-navy">{pkg.name}</h1>
      {sp.error === "delete" && (
        <p role="alert" className="mb-6 border-l-2 border-danger bg-danger/[0.06] px-4 py-2.5 text-sm text-danger">
          The package wasn&rsquo;t deleted: the database didn&rsquo;t confirm the change. Try again.
        </p>
      )}
      <PackageForm pkg={pkg} saved={sp.saved === "1"} />
    </>
  );
}
