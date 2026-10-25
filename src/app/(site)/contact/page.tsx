import { Suspense } from "react";
import type { Metadata } from "next";
import { FaqJsonLd, FaqList, PageHero, SectionHeading } from "@/components/site/sections";
import { QuoteForm, QuoteFormSkeleton } from "@/components/forms/quote-form";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { fullAddress, mapUrl, site } from "@/config/site";
import { contactFaqs } from "@/content/faqs";
import { getPublishedPackages } from "@/lib/packages/repo";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contact & Request a Quote",
  description: `Request a padel court, squash court or wooden sports flooring quotation from SS Infratech, Jaipur. Call ${site.phone.display} or send your project details.`,
  alternates: { canonical: "/contact" },
};

/** Package names only label a ?package= prefill; if they can't be loaded the form still works without them. */
async function QuoteFormWithPackages() {
  const result = await getPublishedPackages();
  const packages = result.status === "ok" ? result.packages.map((p) => ({ slug: p.slug, name: p.name })) : [];
  return <QuoteForm packages={packages} />;
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact SS Infratech"
        intro="Send your project details for a quotation, or call us to talk it through."
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16">
          <div id="quote" className="scroll-mt-28">
            <h2 className="text-h2 text-navy">Request a quote</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
              Five required fields. Add more detail if you have it; we&rsquo;ll ask about the rest when we call.
            </p>
            <div className="mt-8">
              {/* The form reads ?service= and ?package= from the URL to prefill the enquiry. */}
              <Suspense fallback={<QuoteFormSkeleton />}>
                <QuoteFormWithPackages />
              </Suspense>
            </div>
          </div>

          <aside aria-labelledby="contact-details" className="lg:pt-2">
            <div className="border-t-2 border-navy pt-6 lg:sticky lg:top-28">
              <h2 id="contact-details" className="font-display text-[1.9rem] font-bold text-navy">
                Contact details
              </h2>
              <dl className="mt-5 grid gap-5">
                <div>
                  <dt className="text-sm text-muted">Business</dt>
                  <dd className="mt-0.5 font-semibold text-navy">{site.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Phone</dt>
                  <dd>
                    <a href={`tel:${site.phone.e164}`} className="mt-0.5 inline-flex min-h-11 items-center gap-2 text-lg font-semibold text-navy hover:text-turf">
                      <PhoneIcon className="size-5 text-turf" />
                      {site.phone.display}
                    </a>
                  </dd>
                </div>
                {site.email && (
                  <div>
                    <dt className="text-sm text-muted">Email</dt>
                    <dd>
                      <a href={`mailto:${site.email}`} className="mt-0.5 inline-flex min-h-11 items-center gap-2 font-semibold text-navy hover:text-turf">
                        <MailIcon className="size-5 text-turf" />
                        {site.email}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted">Address</dt>
                  <dd className="mt-1">
                    <address className="flex gap-2 leading-relaxed text-char not-italic">
                      <PinIcon className="mt-0.5 size-5 shrink-0 text-turf" />
                      {fullAddress}
                    </address>
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 ml-7 inline-flex min-h-11 items-center font-semibold text-turf hover:text-turf-deep">
                      Open in Google Maps
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Instagram</dt>
                  <dd>
                    <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex min-h-11 items-center gap-2 font-semibold text-navy hover:text-turf">
                      <InstagramIcon className="size-5 text-turf" />
                      {site.instagram.handle}
                    </a>
                  </dd>
                </div>
              </dl>
              <WhatsAppLink variant="outline" size="lg" label="Chat on WhatsApp" className="mt-6 w-full" />
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="contact-faq" className="bg-paper py-16 sm:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <SectionHeading id="contact-faq" title="Before you enquire" />
          <FaqList faqs={contactFaqs} />
        </div>
        <FaqJsonLd faqs={contactFaqs} />
      </section>
    </>
  );
}
