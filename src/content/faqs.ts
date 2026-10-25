import { site } from "@/config/site";

export type Faq = { q: string; a: string };

export const solutionFaqs: Faq[] = [
  {
    q: "What information is needed to request a padel court quotation?",
    a: "The project city, whether the court is indoor or outdoor, how many courts you're planning, and any site measurements or photos you have. A rough timeline and budget range help too, but they're optional.",
  },
  {
    q: "How much space is needed for a padel court?",
    a: "A doubles padel court has an internal playing area of 20 m × 10 m under International Padel Federation rules. You'll need additional space around the court for the structure, access and circulation; the total footprint is confirmed once we know your site and configuration.",
  },
  {
    q: "Can a court be installed indoors?",
    a: "Yes, padel courts can be installed indoors. Ceiling height, the existing floor and lighting all affect the design, so we review the building before confirming the scope.",
  },
  {
    q: "Can a court be installed outdoors?",
    a: "Yes. Outdoor courts need a suitable base, drainage and finishes that cope with sun and rain. These are discussed during the site assessment.",
  },
  {
    q: "What site preparation is required?",
    a: "Usually a level, stable base suited to the court, plus access for materials and installation. Who prepares the base, and to what standard, is agreed in the quotation.",
  },
  {
    q: "What affects the final project cost?",
    a: "Court configuration, the number of courts, the components included, lighting, site conditions, transport distance and the split of civil work. That's why every quotation is prepared for the specific project.",
  },
  {
    q: "Does the quotation include transport and installation?",
    a: "Transport and installation are discussed for each project, and the quotation states clearly what is included and what is excluded.",
  },
  {
    q: "Can multiple courts be installed at one location?",
    a: "Yes. Multi-court facilities are planned together so layout, access and lighting work across all the courts. Mention the number of courts in your enquiry.",
  },
  {
    q: "Does SS Infratech provide squash court solutions?",
    a: "Yes. Squash courts are one of our advertised services. The wall, floor and lighting systems for your court are confirmed during the project discussion.",
  },
  {
    q: "Does SS Infratech offer wooden sports flooring?",
    a: "Yes. We install wooden sports flooring for indoor courts and halls. The floor system is selected around the activity and the site.",
  },
  {
    q: "How is the installation timeline determined?",
    a: "By the scope, the number of courts, manufacturing lead time and when the site is ready. You'll get a timeline with the quotation once these are known.",
  },
  {
    q: "What warranty and maintenance arrangements are available?",
    a: "Warranty terms and maintenance guidance are confirmed in the quotation for each project. Ask us during the discussion if you have specific requirements.",
  },
];

export const contactFaqs: Faq[] = [
  {
    q: "What should I include in my enquiry?",
    a: "Your name, mobile number, the service you need and the project city and state. Court count, indoor or outdoor, budget and timeline are optional, but they help us come back with useful answers sooner.",
  },
  {
    q: "How are quotations prepared?",
    a: "After reviewing your enquiry we discuss the project with you, gather site information, confirm the configuration and scope, and then prepare a written quotation for that project.",
  },
  {
    q: "What do I need on site?",
    a: "Generally a level, stable base and access for materials. Exact requirements depend on the court or floor and are confirmed before work starts.",
  },
  {
    q: "Do you take projects outside Jaipur?",
    a: "Share your project city and state in the form. We'll confirm whether we can take on the project when we contact you.",
  },
  {
    q: "What's the quickest way to reach you?",
    a: `Call ${site.phone.display}, or send the enquiry form and our team will contact you to discuss next steps.`,
  },
];
