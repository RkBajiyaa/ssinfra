/**
 * Single source of truth for business identity and contact details.
 * Values here come from the business's own Instagram graphics. Anything
 * not yet confirmed by the owner is either absent or behind a flag.
 */

const phoneDigits = "9672567423"; // 10-digit Indian mobile, no prefix

export const site = {
  name: "SS Infratech",
  legalName: "SS Infratech",
  descriptor: "Padel Court Manufacturer",
  tagline: "Built Strong. Play Better.",
  secondaryTagline: "Shape Spaces. Elevate Play.",
  description:
    "SS Infratech manufactures and installs padel courts for sports clubs, commercial facilities, hospitality projects and private developments, with squash court solutions and wooden sports flooring.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  phone: {
    display: "096725 67423",
    /** E.164 for tel: links and structured data. */
    e164: `+91${phoneDigits}`,
  },

  /**
   * WhatsApp stays hidden until the owner confirms the number is registered.
   * Set NEXT_PUBLIC_WHATSAPP_ENABLED=true to switch it on everywhere.
   */
  whatsapp: {
    enabled: process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true",
    number: `91${phoneDigits}`,
    message:
      "Hello SS Infratech, I would like to discuss a sports court or flooring project. Please let me know how we can proceed.",
  },

  /** No official email has been supplied; leave null rather than invent one. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,

  address: {
    street: "Road No. 14, Vishwakarma Industrial Area, Harmada",
    locality: "Jaipur",
    region: "Rajasthan",
    postalCode: "302013",
    country: "India",
    countryCode: "IN",
  },

  instagram: {
    handle: "@ss_infratech_padelcourt",
    url: "https://www.instagram.com/ss_infratech_padelcourt/",
  },
} as const;

export const fullAddress = `${site.address.street}, ${site.address.locality}, ${site.address.region} ${site.address.postalCode}, ${site.address.country}`;

export const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.name}, ${fullAddress}`,
)}`;

export function whatsappUrl(message: string = site.whatsapp.message) {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/courts-solutions", label: "Courts & Solutions" },
  { href: "/projects", label: "Projects & Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About Us" },
] as const;
