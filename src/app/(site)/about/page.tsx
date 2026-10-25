import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/site/sections";
import { images } from "@/content/images";
import { solutions } from "@/content/solutions";
import { site } from "@/config/site";
import { ChevronIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "SS Infratech is a Jaipur-based padel court manufacturer and installer, with squash court solutions and wooden sports flooring for sports-facility projects.",
  alternates: { canonical: "/about" },
};

const principles = [
  { title: "Structural quality", text: "Frames, fixings and alignment that keep a court square and playable." },
  { title: "Thoughtful planning", text: "Configuration worked out around your site before anything is fabricated." },
  { title: "Practical coordination", text: "Fabrication, delivery and installation sequenced with your site team." },
  { title: "Courts and floors", text: "Padel courts, squash courts and wooden sports flooring from one supplier." },
  { title: "A clear quotation", text: "Scope, inclusions and exclusions set out in writing before work starts." },
];

const approach = [
  "Understand your requirements",
  "Review site and configuration needs",
  "Confirm scope and pricing",
  "Coordinate supply and installation",
  "Inspect and hand over",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About SS Infratech"
        intro="Padel court manufacturing and installation for businesses and organisations developing sports facilities."
      />

      <section className="py-16 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="text-h2 text-navy">Who we are</h2>
            <p className="mt-5 text-lg leading-relaxed text-char">
              SS Infratech provides padel court manufacturing and installation solutions for businesses and
              organisations developing sports facilities. With additional services in squash courts and wooden sports
              flooring, we support customers in planning and executing sports-infrastructure projects.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              We&rsquo;re based in Vishwakarma Industrial Area, Harmada, Jaipur, and work with clubs, developers,
              hospitality businesses, institutions and investors building sports facilities.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-paper">
            <Image src={images.workshopAssembly.src} alt={images.workshopAssembly.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" placeholder="blur" />
          </div>
        </div>
      </section>

      <section aria-labelledby="positioning" className="bg-navy py-16 text-white sm:py-24">
        <div className="container-site">
          <h2 id="positioning" className="text-display uppercase">
            {site.tagline}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            Our line is simple: a court should be built to last and built to play well. Here is what that means in
            practice.
          </p>
          <dl className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {principles.map((p) => (
              <div key={p.title} className="border-t border-white/25 pt-4">
                <dt className="font-display text-[1.45rem] font-semibold text-brass-light">{p.title}</dt>
                <dd className="mt-2 leading-relaxed text-white/75">{p.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="services" className="py-16 sm:py-24">
        <div className="container-site">
          <h2 id="services" className="text-h2 text-navy">
            What we do
          </h2>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {solutions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/courts-solutions#${s.anchor}`}
                  className="group grid gap-2 py-6 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center sm:gap-8"
                >
                  <span className="font-display text-[1.75rem] leading-tight font-bold text-navy group-hover:text-turf">{s.title}</span>
                  <span className="leading-relaxed text-muted">{s.summary}</span>
                  <ChevronIcon className="hidden size-6 text-turf sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="approach" className="bg-paper py-16 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-white">
            <Image src={images.installationTeam.src} alt={images.installationTeam.alt} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" placeholder="blur" />
          </div>
          <div>
            <h2 id="approach" className="text-h2 text-navy">
              How we work with you
            </h2>
            <ol className="mt-8 grid gap-0">
              {approach.map((step, i) => (
                <li key={step} className="flex items-baseline gap-5 border-b border-line py-4 last:border-b-0">
                  <span className="w-6 font-display text-[1.6rem] font-bold text-turf">{i + 1}</span>
                  <span className="text-lg text-char">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 leading-relaxed text-muted">
              Engineering, architectural and civil-work responsibilities for each project are agreed in the quotation.
            </p>
          </div>
        </div>
      </section>

      <CtaBand title="Let's talk about your project" />
    </>
  );
}
