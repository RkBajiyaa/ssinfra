import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";
import { fullAddress, mainNav, mapUrl, site, whatsappUrl } from "@/config/site";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  const linkClass = "inline-flex min-h-10 items-center gap-3 text-white/80 hover:text-white";
  return (
    <footer className="bg-navy-deep text-white">
      <div className="container-site grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.2fr] lg:py-20">
        <div className="max-w-sm">
          <Logo tone="light" />
          <p className="mt-5 text-[0.95rem] leading-relaxed text-white/75">
            Padel court manufacturing and installation, with squash court solutions and wooden sports flooring,
            from Jaipur.
          </p>
          <p className="mt-6 font-display text-2xl font-semibold text-brass-light">{site.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="font-sans text-sm font-semibold text-white/60">Pages</h2>
          <ul className="mt-3 grid gap-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-sans text-sm font-semibold text-white/60">Contact</h2>
          <ul className="mt-3 grid gap-1.5">
            <li>
              <a href={`tel:${site.phone.e164}`} className={linkClass}>
                <PhoneIcon className="size-5 shrink-0 text-brass-light" />
                {site.phone.display}
              </a>
            </li>
            {site.whatsapp.enabled && (
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <WhatsAppIcon className="size-5 shrink-0 text-brass-light" />
                  WhatsApp
                </a>
              </li>
            )}
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className={linkClass}>
                  <MailIcon className="size-5 shrink-0 text-brass-light" />
                  {site.email}
                </a>
              </li>
            )}
            <li>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <InstagramIcon className="size-5 shrink-0 text-brass-light" />
                {site.instagram.handle}
              </a>
            </li>
            <li>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 py-2 text-white/80 hover:text-white"
              >
                <PinIcon className="mt-0.5 size-5 shrink-0 text-brass-light" />
                <span className="leading-relaxed">{fullAddress}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-sm text-white/55 sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> {site.legalName}. All rights reserved.
          </p>
          <p>{site.secondaryTagline}</p>
        </div>
      </div>
    </footer>
  );
}
