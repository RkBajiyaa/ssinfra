import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Tracker } from "@/components/site/tracker";
import { JsonLd } from "@/components/site/sections";
import { site } from "@/config/site";

/** Structured data uses only details visible in the business's own graphics. */
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${site.url}/#business`,
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: site.phone.e164,
  image: `${site.url}/images/projects/padel-multi-court-facility-dusk.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    postalCode: site.address.postalCode,
    addressCountry: site.address.countryCode,
  },
  sameAs: [site.instagram.url],
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <JsonLd data={localBusiness} />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Tracker />
    </>
  );
}
