import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections";
import { fullAddress, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SS Infratech collects and uses information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

/*
 * Plain-language draft describing what this site actually does. The owner
 * should have it reviewed before launch (e.g. against India's DPDP Act, 2023).
 */
export default function PrivacyPage() {
  const h2 = "mt-10 font-display text-[1.75rem] font-bold text-navy";
  const p = "mt-3 leading-relaxed text-char";
  return (
    <>
      <PageHero title="Privacy Policy" intro="What we collect through this website, why, and what we do with it." />
      <section className="py-12 sm:py-16">
        <div className="container-site max-w-3xl">
          <h2 className={h2}>Enquiries you send us</h2>
          <p className={p}>
            When you submit the quotation form, we store the details you enter: your name, mobile number, the service
            you need, the project city and state, and any optional details you choose to add (such as business name,
            email, number of courts, budget range, timeline and project notes). We also record which page the form
            was sent from and, where available, how you found the site (for example the referring website or a
            campaign tag in the link).
          </p>
          <p className={p}>
            We use this information only to respond to your enquiry, prepare a quotation and follow up on your
            project. We don&rsquo;t sell it or share it with third parties for marketing.
          </p>

          <h2 className={h2}>Visitor statistics</h2>
          <p className={p}>
            We count page visits to understand how many people use the site and which pages they read. This doesn&rsquo;t
            use cookies and nothing is stored on your device. To tell visits apart within a single day, we combine your
            IP address and browser details with a secret value and the date, then keep only a one-way scrambled code.
            The code changes every day and cannot be turned back into your IP address. We don&rsquo;t store raw IP
            addresses for statistics. If your browser sends a Global Privacy Control signal, we don&rsquo;t count your
            visits.
          </p>

          <h2 className={h2}>Where the data is kept</h2>
          <p className={p}>
            Enquiries and statistics are stored in Google Firebase (Cloud Firestore). Only authorised SS Infratech
            staff can access enquiries.
          </p>

          <h2 className={h2}>Your choices</h2>
          <p className={p}>
            To ask what we hold about you, correct it or have your enquiry deleted, call us on{" "}
            <a href={`tel:${site.phone.e164}`} className="font-semibold text-navy underline underline-offset-2">
              {site.phone.display}
            </a>{" "}
            or write to us at {fullAddress}.
          </p>

          <h2 className={h2}>Links to other sites</h2>
          <p className={p}>
            Links to Instagram, WhatsApp and Google Maps take you to services with their own privacy policies.
          </p>
        </div>
      </section>
    </>
  );
}
