import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/site/sections";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { activeGalleryCategories, publishedGallery } from "@/content/gallery";
import { site } from "@/config/site";
import { InstagramIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Projects & Gallery",
  description:
    "Photographs of SS Infratech padel courts, squash courts, wooden sports flooring, workshop fabrication and installation work.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        title="Projects & Gallery"
        intro="Courts, floors and the work behind them: fabrication in the workshop, installation on site and the finished result."
      />
      <section aria-label="Project photographs" className="py-12 sm:py-16">
        <div className="container-site">
          <GalleryGrid items={publishedGallery} categories={[...activeGalleryCategories]} />
          <div className="mt-6 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl leading-relaxed text-muted">
              More site updates are posted on our Instagram as projects progress.
            </p>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-navy hover:text-turf"
            >
              <InstagramIcon className="size-5" />
              {site.instagram.handle}
            </a>
          </div>
        </div>
      </section>
      <CtaBand
        title="Want a court like these?"
        text="Share your site and requirements, and we'll discuss the configuration and scope that fits your project."
      />
    </>
  );
}
