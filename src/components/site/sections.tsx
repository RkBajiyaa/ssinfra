import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { CourtPlan } from "@/components/brand/court-plan";
import { site } from "@/config/site";
import type { Faq } from "@/content/faqs";
import { WhatsAppLink } from "./whatsapp-link";

/** Inner-page header band: navy, left-aligned, with a faint court plan as the page's signature. */
export function PageHero({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <CourtPlan
        tone="light"
        title=""
        className="pointer-events-none absolute top-1/2 -right-16 hidden w-[26rem] -translate-y-1/2 opacity-[0.16] md:block lg:right-8 lg:w-[30rem]"
      />
      <div className="container-site relative py-14 sm:py-20 lg:py-24">
        <h1 className="max-w-3xl text-h1 uppercase">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{intro}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  intro,
  id,
  className = "",
}: {
  title: string;
  intro?: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-3xl ${className}`}>
      <h2 id={id} className="text-h2 text-navy">
        {title}
      </h2>
      {intro && <div className="mt-4 text-lg leading-relaxed text-muted">{intro}</div>}
    </div>
  );
}

export function CtaBand({
  title = "Planning a Padel Court Project?",
  text = "Tell us about your site, preferred configuration and project requirements. Our team can review your enquiry and discuss the next steps.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="bg-paper">
      <div className="container-site py-16 sm:py-20">
        <div className="grid gap-8 border-l-2 border-brass pl-5 sm:pl-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <h2 className="text-h2 text-navy">{title}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{text}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <LinkButton href="/contact#quote" size="lg">
              Request a Quote
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg">
              Contact Us
            </LinkButton>
            <WhatsAppLink size="lg" />
          </div>
        </div>
        <p className="mt-6 pl-5 text-sm text-muted sm:pl-8">
          Prefer to talk? Call{" "}
          <a href={`tel:${site.phone.e164}`} className="font-semibold text-navy underline-offset-4 hover:underline">
            {site.phone.display}
          </a>
          .
        </p>
      </div>
    </section>
  );
}

/** Native <details> keeps FAQs accessible and works without JavaScript. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-16 items-center justify-between gap-6 py-4 text-left text-[1.05rem] font-semibold text-navy">
            {f.q}
            <PlusIcon className="size-5 shrink-0 text-turf transition-transform duration-200 group-open:rotate-45" />
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return <JsonLd data={data} />;
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so content can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
