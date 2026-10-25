import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { ChevronIcon } from "@/components/ui/icons";
import { CourtPlan } from "@/components/brand/court-plan";
import { CtaBand, SectionHeading } from "@/components/site/sections";
import { images } from "@/content/images";
import { solutions, homeProcess, strengths } from "@/content/solutions";
import { publishedGallery } from "@/content/gallery";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} | Padel Court Manufacturer & Installer in Jaipur` },
  description:
    "Padel court manufacturing and installation for sports clubs, commercial facilities, hospitality projects and private developments. Squash court solutions and wooden sports flooring from Jaipur.",
  alternates: { canonical: "/" },
  openGraph: { images: [{ url: images.multiCourtDusk.src.src, alt: images.multiCourtDusk.alt }] },
};

export default function HomePage() {
  const [padel, squash, flooring] = solutions;
  const showcase = publishedGallery.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="grid lg:min-h-[min(46rem,calc(100dvh-4.75rem))] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="container-site flex flex-col justify-center py-12 sm:py-16 lg:mr-0 lg:max-w-[42rem] lg:py-20 lg:pr-12">
            <p className="hero-rise text-[0.95rem] font-medium text-brass-light">Padel court manufacturer in Jaipur</p>
            <h1 className="hero-rise mt-4 text-display uppercase" style={{ "--delay": "0.08s" } as React.CSSProperties}>
              Built strong.
              <br />
              Play better.
            </h1>
            <p
              className="hero-rise mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl"
              style={{ "--delay": "0.16s" } as React.CSSProperties}
            >
              Padel court manufacturing and installation solutions for sports clubs, commercial facilities,
              hospitality projects and private developments.
            </p>
            <div
              className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ "--delay": "0.24s" } as React.CSSProperties}
            >
              <LinkButton href="/contact?service=padel#quote" size="lg">
                Request a Project Quote
              </LinkButton>
              <LinkButton href="/courts-solutions" variant="outline-light" size="lg">
                Explore Our Solutions
              </LinkButton>
            </div>
            <div className="mt-12 hidden max-w-sm sm:block">
              <CourtPlan animate className="w-full" />
              <p className="mt-2 text-xs text-white/55">Standard doubles court, International Padel Federation dimensions</p>
            </div>
          </div>
          <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto">
            <Image
              src={images.multiCourtDusk.src}
              alt={images.multiCourtDusk.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              placeholder="blur"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section aria-labelledby="services-heading" className="py-16 sm:py-24">
        <div className="container-site">
          <SectionHeading
            id="services-heading"
            title="Courts and floors for serious sport"
            intro="Three services, one team. Padel courts are our core work, alongside squash courts and wooden sports flooring."
          />

          <article className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-14">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] bg-paper">
              <Image src={padel.image.src} alt={padel.image.alt} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" placeholder="blur" />
            </div>
            <div>
              <h3 className="text-h3 text-navy">{padel.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-muted">{padel.summary}</p>
              <ul className="mt-6 grid gap-2 text-[0.98rem] text-char sm:grid-cols-2">
                {padel.scope.slice(0, 6).map((s) => (
                  <li key={s.title} className="flex gap-2.5">
                    <span className="mt-2.5 h-px w-3 shrink-0 bg-brass" aria-hidden="true" />
                    {s.title}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href={`/courts-solutions#${padel.anchor}`} variant="dark">
                  Learn more about padel courts
                </LinkButton>
                <LinkButton href="/contact?service=padel#quote" variant="outline">
                  Request a quote
                </LinkButton>
              </div>
            </div>
          </article>

          <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-8 lg:gap-12">
            {[squash, flooring].map((s) => (
              <article key={s.id}>
                <div className="relative aspect-[3/2] overflow-hidden rounded-[3px] bg-paper">
                  <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" placeholder="blur" />
                </div>
                <h3 className="mt-6 text-h3 text-navy">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{s.summary}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <Link
                    href={`/courts-solutions#${s.anchor}`}
                    className="inline-flex min-h-11 items-center gap-1 font-semibold text-turf hover:text-turf-deep"
                  >
                    Learn more
                    <ChevronIcon className="size-4" />
                  </Link>
                  <Link
                    href={`/contact?service=${s.id}#quote`}
                    className="inline-flex min-h-11 items-center font-semibold text-navy underline-offset-4 hover:underline"
                  >
                    Enquire about {s.id === "squash" ? "squash courts" : "flooring"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why SS Infratech */}
      <section aria-labelledby="why-heading" className="bg-paper py-16 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 id="why-heading" className="text-h2 text-navy">
              Why choose SS Infratech?
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
              A padel court is a steel and glass structure that has to stay square, safe and playable. That&rsquo;s
              where we put our attention.
            </p>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-[3px]">
              <Image src={images.steelFrameDetail.src} alt={images.steelFrameDetail.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" placeholder="blur" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {strengths.map((s) => (
                <div key={s.title} className="border-t-2 border-navy pt-5">
                  <dt className="font-display text-[1.6rem] leading-tight font-semibold text-navy">{s.title}</dt>
                  <dd className="mt-3 leading-relaxed text-muted">{s.text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-12 font-display text-[2rem] font-bold uppercase text-navy sm:text-[2.4rem]">
              {site.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Project showcase */}
      <section aria-labelledby="work-heading" className="py-16 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="work-heading" title="Recent work" intro="Courts, floors and installation work from our projects." />
            <LinkButton href="/projects" variant="outline" className="self-start sm:self-auto">
              View all projects
            </LinkButton>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[auto_auto]">
            {showcase.map((item, i) => (
              <li key={item.id} className={i === 0 ? "col-span-2 lg:row-span-2" : i === 3 ? "col-span-2 lg:col-span-1" : ""}>
                <Link href="/projects" className="group block">
                  <div className={`relative overflow-hidden rounded-[3px] bg-paper ${i === 0 ? "aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[28rem]" : "aspect-[4/3]"}`}>
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes={i === 0 ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      placeholder="blur"
                    />
                  </div>
                  <p className="mt-2.5 text-[0.95rem] font-medium text-navy">{item.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section aria-labelledby="process-heading" className="bg-navy py-16 text-white sm:py-24">
        <div className="container-site">
          <h2 id="process-heading" className="text-h2">
            How a project works
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Five stages from first conversation to handover. Exact scope and timeline depend on your project and site.
          </p>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {homeProcess.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3 text-brass-light">
                  <span className="font-display text-[2.6rem] leading-none font-bold">{i + 1}</span>
                  <span className="dim-rule hidden h-3 flex-1 text-white/25 lg:block" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-display text-[1.45rem] leading-tight font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-white/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
