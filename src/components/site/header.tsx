import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { site } from "@/config/site";
import { PhoneIcon } from "@/components/ui/icons";
import { DesktopNav, MobileNav } from "./nav";
import { WhatsAppLink } from "./whatsapp-link";

export function Header() {
  return (
    // Solid background on purpose: a backdrop-filter here would become the containing
    // block for the fixed-position mobile menu and collapse it to the header's height.
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-[4.75rem]">
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
          <Logo />
        </Link>
        <DesktopNav />
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={`tel:${site.phone.e164}`}
            className="inline-flex min-h-11 items-center gap-2 px-2 text-[0.95rem] font-medium text-navy xl:px-3"
          >
            <PhoneIcon className="size-[1.1rem] text-turf" />
            <span className="hidden xl:inline">{site.phone.display}</span>
            <span className="sr-only xl:hidden">Call {site.phone.display}</span>
          </a>
          <WhatsAppLink
            iconOnly
            className="inline-flex size-11 items-center justify-center rounded-[3px] text-[#128c4b] hover:bg-paper"
          />
          <LinkButton href="/contact#quote" variant="primary">
            Request a Quote
          </LinkButton>
        </div>
        <MobileNav whatsapp={<WhatsAppLink variant="outline" size="lg" label="Chat on WhatsApp" />} />
      </div>
    </header>
  );
}
