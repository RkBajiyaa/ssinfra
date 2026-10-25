#!/usr/bin/env node
/**
 * Loads the five starter package templates. They are templates, not
 * confirmed products: no prices, every one set to "custom quotation", and
 * all HIDDEN until the owner reviews and switches them on in the admin.
 * Existing packages with the same slug are left untouched.
 *
 *   node --env-file=.env.local scripts/seed-packages.mjs
 */
import { FieldValue } from "firebase-admin/firestore";
import { db, target } from "./_firebase.mjs";

const templates = [
  {
    slug: "padel-standard",
    name: "Padel Court – Standard",
    serviceCategory: "padel",
    shortDescription: "A standard padel court configuration for clubs, facilities and private projects.",
    includedFeatures: ["Structural steel framework", "Glass enclosure", "Mesh fencing", "Playing surface", "Net and court markings", "Transport and installation"],
    optionalFeatures: ["Sports lighting"],
    exclusions: ["Foundation and civil works (unless agreed)"],
    displayOrder: 10,
  },
  {
    slug: "padel-panoramic",
    name: "Padel Court – Panoramic",
    serviceCategory: "padel",
    shortDescription: "A panoramic-style configuration with more continuous glass for clearer spectator views.",
    includedFeatures: ["Panoramic configuration", "Structural framework", "Glass enclosure", "Playing surface", "Transport and installation"],
    optionalFeatures: ["Sports lighting"],
    exclusions: ["Site preparation and civil works (unless agreed)"],
    displayOrder: 20,
  },
  {
    slug: "padel-custom-multi-court",
    name: "Padel Court – Custom / Multi-Court",
    serviceCategory: "padel",
    shortDescription: "Multiple courts or a site-specific design, planned and quoted together.",
    includedFeatures: ["Number of courts to suit your site", "Site-specific configuration", "Indoor or outdoor planning", "Project coordination", "Custom installation scope"],
    optionalFeatures: ["Lighting and other options"],
    exclusions: [],
    displayOrder: 30,
  },
  {
    slug: "squash-court",
    name: "Squash Court Solutions",
    serviceCategory: "squash",
    shortDescription: "Squash court planning and installation for clubs, schools and residential projects.",
    includedFeatures: ["Court configuration", "Wall and floor systems", "Installation"],
    optionalFeatures: ["Lighting", "Glass back wall"],
    exclusions: ["Site preparation (unless agreed)"],
    displayOrder: 40,
  },
  {
    slug: "wooden-sports-flooring",
    name: "Wooden Sports Flooring",
    serviceCategory: "flooring",
    shortDescription: "Wooden sports flooring for indoor courts and halls, quoted by area and system.",
    includedFeatures: ["Flooring system selection", "Installation", "Finishing"],
    optionalFeatures: ["Line marking"],
    exclusions: ["Subfloor repairs (unless agreed)"],
    displayOrder: 50,
  },
];

const col = db.collection("service_packages");
let created = 0;
for (const t of templates) {
  const existing = await col.where("slug", "==", t.slug).limit(1).get();
  if (!existing.empty) {
    console.log(`skip  ${t.slug} (already exists)`);
    continue;
  }
  await col.add({
    ...t,
    priceMode: "quote",
    priceAmount: null,
    priceCurrency: "INR",
    priceUnit: null,
    ctaLabel: "Request a Quote",
    isActive: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  created++;
  console.log(`added ${t.slug}`);
}
console.log(`Done: ${created} template(s) added to ${target}. They are hidden until switched on in Admin > Pricing.`);
