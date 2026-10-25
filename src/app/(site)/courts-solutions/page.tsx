import Image from "next/image";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { CourtPlan } from "@/components/brand/court-plan";
import { CtaBand, FaqJsonLd, FaqList, PageHero, SectionHeading } from "@/components/site/sections";
import { PackageList } from "@/components/site/packages";
import { courtTypes, installationSteps, padelSpecs, solutions, type Solution } from "@/content/solutions";
import { solutionFaqs } from "@/content/faqs";

export const metadata: Metadata = {
  title: "Padel Courts, Squash Courts & Sports Flooring",
  description:
    "Padel court manufacturing and installation, court configurations and specifications, squash court solutions and wooden sports flooring. Request a project-specific quotation from SS Infratech.",
  alternates: { canonical: "/courts-solutions" },
};

const toc = [
  { href: "#padel-courts", label: "Padel courts" },
  { href: "#configurations", label: "Configurations" },
  { href: "#specifications", label: "Specifications" },
  { href: "#squash-courts", label: "Squash courts" },
  { href: "#wooden-flooring", label: "Sports flooring" },
  { href: "#process", label: "Process" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

function SolutionSection({ s, flip = false, tint = false }: { s: Solution; flip?: boolean; tint?: boolean }) {
  return (
    <section id={s.anchor} aria-labelledby={`${s.anchor}-h`} className={`scroll-mt-32 py-16 sm:py-24 ${tint ? "bg-paper" : ""}`}>
      <div className="container-site">
        <div className={`grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-paper">
            <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" placeholder="blur" />
          </div>
          <div>
            <h2 id={`${s.anchor}-h`} className="text-h2 text-navy">
              {s.title}
            </h2>
            {s.intro.map((p) => (
              <p key={p.slice(0, 24)} className="mt-4 text-lg leading-relaxed text-muted">
                {p}
              </p>
            ))}
            <LinkButton href={`/contact?service=${s.id}#quote`} className="mt-8">
              Request a quote for {s.id === "padel" ? "padel courts" : s.id === "squash" ? "squash courts" : "sports flooring"}
            </LinkButton>
          </div>
        </div>
        <h3 className="mt-16 text-h3 text-navy">{s.scopeHeading}</h3>
        <dl className="mt-6 grid gap-x-10 gap-y-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {s.scope.map((item) => (
            <div key={item.title}>
              <dt className="font-semibold text-navy">{item.title}</dt>
              <dd className="mt-1 leading-relaxed text-muted">{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default function CourtsSolutionsPage() {
  const [padel, squash, flooring] = solutions;
  return (
    <>
      <PageHero
        title="Courts & Solutions"
        intro="What we build, what goes into it, and how a project moves from first enquiry to handover."
      >
        <LinkButton href="/contact#quote" size="lg">
          Request a Quote
        </LinkButton>
      </PageHero>

      <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-line bg-white/95 backdrop-blur lg:top-[4.75rem]">
        <ul className="container-site flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {toc.map((t) => (
            <li key={t.href} className="shrink-0">
              <a href={t.href} className="inline-flex min-h-10 items-center rounded-[3px] px-3 text-sm font-medium text-muted hover:bg-paper hover:text-navy">
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <SolutionSection s={padel!} />

      <section id="configurations" aria-labelledby="config-h" className="scroll-mt-32 bg-navy py-16 text-white sm:py-24">
        <div className="container-site">
          <h2 id="config-h" className="text-h2">
            Court types and configurations
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Common configurations buyers consider. Which suits you depends on your site space, structure, installation
            environment and goals; we confirm the available options for your project during the discussion.
          </p>
          <dl className="mt-12 grid gap-px overflow-hidden bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {courtTypes.map((c) => (
              <div key={c.title} className="bg-navy p-6 sm:p-7">
                <dt className="font-display text-[1.6rem] font-semibold">{c.title}</dt>
                <dd className="mt-2 leading-relaxed text-white/70">{c.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="specifications" aria-labelledby="spec-h" className="scroll-mt-32 py-16 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              id="spec-h"
              title="Technical specifications"
              intro={
                <>
                  <p>
                    A standard doubles padel court has an internal playing area of 20 m × 10 m under the International
                    Padel Federation&rsquo;s published rules.
                  </p>
                  <p className="mt-4">
                    Everything else on this sheet is specified for your design and site, and written into your
                    quotation.
                  </p>
                </>
              }
            />
            <figure className="mt-10 border border-line p-5">
              <CourtPlan tone="dark" className="w-full" />
              <figcaption className="mt-3 text-sm text-muted">Doubles court plan, drawn to scale.</figcaption>
            </figure>
          </div>
          {/* Laid out like a drawing's specification block */}
          <div className="self-start border-2 border-navy">
            <div className="flex items-center justify-between bg-navy px-5 py-3 text-white">
              <p className="font-display text-xl font-semibold">Padel court specification sheet</p>
              <p className="text-sm text-white/70">SS Infratech</p>
            </div>
            <table className="w-full text-left text-[0.95rem]">
              <caption className="sr-only">Padel court specification fields and confirmed values</caption>
              <thead className="border-b border-navy/20 bg-paper text-sm text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Item</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-semibold md:table-cell">Covers</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold sm:px-5">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {padelSpecs.map((row) => (
                  <tr key={row.label} className="align-top">
                    <th scope="row" className="px-4 py-3.5 font-semibold text-navy sm:px-5">
                      {row.label}
                      <span className="mt-0.5 block font-normal text-muted md:hidden">{row.covers}</span>
                    </th>
                    <td className="hidden px-4 py-3.5 text-muted md:table-cell">{row.covers}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      {row.confirmed ? (
                        <>
                          <span className="font-semibold text-navy">{row.confirmed}</span>
                          {row.source && <span className="mt-0.5 block text-xs text-muted">{row.source}</span>}
                        </>
                      ) : (
                        <span className="text-muted">Confirmed in your quotation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <SolutionSection s={squash!} flip tint />
      <SolutionSection s={flooring!} />

      <section id="process" aria-labelledby="process-h" className="scroll-mt-32 bg-paper py-16 sm:py-24">
        <div className="container-site">
          <SectionHeading
            id="process-h"
            title="Our installation process"
            intro="The usual sequence for a project. The order can vary, and installation duration, site preparation and who handles civil work are confirmed in each quotation."
          />
          <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {installationSteps.map((step, i) => (
              <li key={step.title} className="border-t-2 border-navy pt-4">
                <span className="font-display text-[2rem] leading-none font-bold text-turf">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-[1.45rem] leading-tight font-semibold text-navy">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-32 py-16 sm:py-24">
        <div className="container-site">
          <SectionHeading
            id="pricing-h"
            title="Pricing and packages"
            intro="The final quotation depends on configuration, site conditions, installation requirements and the agreed scope. For multi-court and custom projects, request a quote and we'll prepare one for your site."
          />
          <div className="mt-10">
            <PackageList />
          </div>
        </div>
      </section>

      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-32 bg-paper py-16 sm:py-24">
        <div className="container-site grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <SectionHeading id="faq-h" title="Frequently asked questions" intro="If your question isn't here, ask us when you enquire." />
          <FaqList faqs={solutionFaqs} />
        </div>
        <FaqJsonLd faqs={solutionFaqs} />
      </section>

      <CtaBand
        title="Tell us what you're planning"
        text="Share your site location, the courts or flooring you need and anything you already know about the space. We'll review it and come back to discuss the next steps."
      />
    </>
  );
}
