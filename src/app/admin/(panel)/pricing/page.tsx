import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { logFirebaseError } from "@/lib/firebase/errors";
import { getAllPackages } from "@/lib/packages/repo";
import { PACKAGE_CATEGORIES, priceLine } from "@/lib/packages/schema";
import { togglePackageAction } from "@/lib/admin/actions";
import { AdminTitle, SetupNotice, Skeleton } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing & packages" };

export default function PricingPage({ searchParams }: PageProps<"/admin/pricing">) {
  return (
    <>
      <AdminTitle title="Pricing & packages">
        <Link href="/admin/pricing/new" className={buttonClass("primary", "md")}>
          New package
        </Link>
      </AdminTitle>
      <p className="mt-3 max-w-2xl text-muted">
        Active packages appear in the Pricing section of the Courts &amp; Solutions page. Changes show on the website
        as soon as you save.
      </p>
      <Suspense fallback={<Skeleton className="mt-6 h-72" />}>
        <PackageTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PackageTable({ searchParams }: { searchParams: PageProps<"/admin/pricing">["searchParams"] }) {
  await requireAdmin();
  const { deleted, error } = await searchParams;
  let packages;
  try {
    packages = await getAllPackages();
  } catch (err) {
    return <div className="mt-6"><SetupNotice kind={logFirebaseError("admin packages", err)} /></div>;
  }

  return (
    <div className="mt-6">
      {error === "toggle" && (
        <p role="alert" className="mb-4 border-l-2 border-danger bg-danger/[0.06] px-4 py-2.5 text-sm text-danger">
          The package wasn&rsquo;t shown or hidden: the database didn&rsquo;t save the change. Try again.
        </p>
      )}
      {deleted && (
        <p role="status" className="mb-4 border-l-2 border-ok bg-ok/[0.06] px-4 py-2.5 text-sm text-ok">
          Package deleted.
        </p>
      )}
      {packages.length === 0 ? (
        <div className="border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-2xl font-semibold text-navy">No packages yet</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Without packages, the website asks visitors to request a quotation. Create one, or run the seed script to
            load the five starter templates.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {packages.map((p) => {
            const price = priceLine(p);
            return (
              <li key={p.id} className="flex flex-col gap-4 border border-line bg-white p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/pricing/${p.id}`} className="font-display text-[1.45rem] leading-tight font-bold text-navy hover:text-turf">
                      {p.name}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        p.isActive ? "bg-ok/10 text-ok ring-ok/30" : "bg-char/5 text-muted ring-char/15"
                      }`}
                    >
                      {p.isActive ? "Shown on website" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {PACKAGE_CATEGORIES.find((c) => c.id === p.serviceCategory)?.label}, order {p.displayOrder}.{" "}
                    {price.label}
                    {price.amount ? `: ${price.amount}${price.unit ? ` ${price.unit}` : ""}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={togglePackageAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="isActive" value={p.isActive ? "false" : "true"} />
                    <button type="submit" className={buttonClass("outline", "md")}>
                      {p.isActive ? "Hide" : "Show"}
                    </button>
                  </form>
                  <Link href={`/admin/pricing/${p.id}`} className={buttonClass("dark", "md")}>
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
