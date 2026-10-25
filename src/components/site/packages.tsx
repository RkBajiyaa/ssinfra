import { Suspense } from "react";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { CheckIcon, MinusIcon, PhoneIcon, PlusIcon } from "@/components/ui/icons";
import { site } from "@/config/site";
import { getPublishedPackages } from "@/lib/packages/repo";
import { PACKAGE_CATEGORIES, priceLine, type ServicePackage } from "@/lib/packages/schema";

function enquiryHref(p: ServicePackage) {
  const params = new URLSearchParams({ service: p.serviceCategory, package: p.slug });
  return `/contact?${params.toString()}#quote`;
}

function PackageCard({ p }: { p: ServicePackage }) {
  const price = priceLine(p);
  const category = PACKAGE_CATEGORIES.find((c) => c.id === p.serviceCategory)?.label;
  return (
    <article className="flex flex-col border border-line bg-white">
      <header className="border-b border-line p-5 sm:p-6">
        <p className="text-sm font-medium text-muted">{category}</p>
        <h3 className="mt-1 font-display text-[1.75rem] leading-tight font-bold text-navy">{p.name}</h3>
        {p.shortDescription && <p className="mt-2 leading-relaxed text-muted">{p.shortDescription}</p>}
      </header>
      <div className="border-b border-line bg-paper px-5 py-4 sm:px-6">
        <p className="text-sm text-muted">{price.label}</p>
        {price.amount ? (
          <p className="font-display text-[2rem] leading-none font-bold text-navy">
            {price.amount}
            {price.unit && <span className="ml-1.5 font-sans text-base font-medium text-muted">{price.unit}</span>}
          </p>
        ) : (
          <p className="font-display text-[1.5rem] leading-tight font-semibold text-navy">Priced for your project</p>
        )}
      </div>
      <div className="grid flex-1 gap-5 p-5 sm:p-6">
        {p.includedFeatures.length > 0 && (
          <FeatureList title="Scope can include" items={p.includedFeatures} icon={<CheckIcon className="size-4 text-ok" />} />
        )}
        {p.optionalFeatures.length > 0 && (
          <FeatureList title="Optional" items={p.optionalFeatures} icon={<PlusIcon className="size-4 text-turf" />} />
        )}
        {p.exclusions.length > 0 && (
          <FeatureList title="Usually excluded" items={p.exclusions} icon={<MinusIcon className="size-4 text-steel" />} />
        )}
      </div>
      <div className="p-5 pt-0 sm:p-6 sm:pt-0">
        <LinkButton href={enquiryHref(p)} className="w-full">
          {p.ctaLabel}
        </LinkButton>
      </div>
    </article>
  );
}

function FeatureList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-navy">{title}</h4>
      <ul className="mt-2 grid gap-1.5 text-[0.95rem] text-char">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className="mt-1 shrink-0">{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Packages come from Firestore (managed in the admin) at request time, so they
 * stream into the otherwise static page. Never throws: if the database can't
 * be read, visitors get the quotation route instead of an error.
 */
export function PackageList() {
  return (
    <Suspense fallback={<PackageListSkeleton />}>
      <PackageListContent />
    </Suspense>
  );
}

function PackageListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading packages" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-80 animate-pulse border border-line bg-paper" />
      ))}
    </div>
  );
}

async function PackageListContent() {
  const result = await getPublishedPackages();
  if (result.status === "unavailable") {
    return (
      <div className="border border-line bg-white p-6 sm:p-8">
        <p className="font-display text-[1.6rem] font-semibold text-navy">Contact us for current pricing</p>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Send your project details and we&rsquo;ll reply with current package options and a quotation for your site,
          or call us on {site.phone.display}.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <LinkButton href="/contact#quote">Request a Quote</LinkButton>
          <a href={`tel:${site.phone.e164}`} className={buttonClass("outline", "md")}>
            <PhoneIcon className="size-4" />
            Call {site.phone.display}
          </a>
        </div>
      </div>
    );
  }
  const packages = result.packages;
  if (packages.length === 0) {
    return (
      <div className="border border-line bg-white p-6 sm:p-8">
        <p className="font-display text-[1.6rem] font-semibold text-navy">Every project is quoted individually</p>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">
          Tell us about your site and the courts or flooring you need, and we&rsquo;ll prepare a quotation for your
          project.
        </p>
        <LinkButton href="/contact#quote" className="mt-5">
          Request a Quote
        </LinkButton>
      </div>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {packages.map((p) => (
        <PackageCard key={p.id} p={p} />
      ))}
    </div>
  );
}
