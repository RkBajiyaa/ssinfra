import { images, type SiteImage } from "./images";
import type { ServiceId } from "@/lib/domain";

/*
 * Copy for the three advertised services. Wording describes what a buyer
 * should plan for; it deliberately avoids specific materials, ratings,
 * warranties or timelines until SS Infratech confirms them.
 */

export type Solution = {
  id: Extract<ServiceId, "padel" | "squash" | "flooring">;
  anchor: string;
  title: string;
  summary: string;
  image: SiteImage;
  intro: string[];
  scopeHeading: string;
  scope: { title: string; text: string }[];
};

export const solutions: Solution[] = [
  {
    id: "padel",
    anchor: "padel-courts",
    title: "Padel Court Manufacturing & Installation",
    summary:
      "Steel-framed padel courts with glass and mesh enclosures, manufactured for your site and installed by our team.",
    image: images.panoramicDusk,
    intro: [
      "SS Infratech manufactures and installs padel courts for clubs, commercial facilities, hospitality projects and private developments. Every court is planned around the site it will stand on, the way it will be used and the scope agreed in the quotation.",
      "The parts below make up a typical padel court. Which of them SS Infratech supplies, and to what specification, is set out line by line in your quotation.",
    ],
    scopeHeading: "What goes into a padel court",
    scope: [
      { title: "Structural steel framework", text: "The posts and beams that carry the glass and mesh, fabricated and finished before dispatch." },
      { title: "Glass enclosure", text: "Tempered glass back and side walls that form the main playing walls." },
      { title: "Mesh fencing", text: "Welded metal mesh above and beside the glass, completing the enclosure." },
      { title: "Playing surface", text: "Artificial turf or another suitable surface, chosen for indoor or outdoor use." },
      { title: "Net and court markings", text: "Centre net, posts and line markings laid out to the court dimensions." },
      { title: "Sports lighting", text: "Court lighting where the project calls for evening or indoor play." },
      { title: "Doors and access points", text: "Entry doors positioned to suit the court layout and circulation around it." },
      { title: "Foundation coordination", text: "Guidance on the base the court needs, and who prepares it, agreed before work starts." },
      { title: "Installation and commissioning", text: "On-site assembly, alignment and a final check before the court is handed over." },
    ],
  },
  {
    id: "squash",
    anchor: "squash-courts",
    title: "Squash Court Solutions",
    summary: "Squash court planning and installation, from wall and floor systems to lighting and site coordination.",
    image: images.squashGlassWall,
    intro: [
      "SS Infratech offers squash court solutions for clubs, schools, residential complexes and fitness facilities. A squash court is a closed room with demanding wall, floor and lighting requirements, so planning starts with the space you have.",
      "The system, materials and finishes for your court are confirmed during the project discussion and written into the quotation.",
    ],
    scopeHeading: "What we plan with you",
    scope: [
      { title: "Court layout and planning", text: "Fitting the court, viewing area and access into the available room." },
      { title: "Wall and playing-surface systems", text: "Front, side and back walls, including glass back-wall options where required." },
      { title: "Flooring", text: "A sports floor suited to squash, coordinated with the wall installation." },
      { title: "Lighting", text: "Even, glare-controlled lighting across the playing area." },
      { title: "Site preparation", text: "What the room needs before installation: levels, surfaces and services." },
      { title: "Installation coordination", text: "Sequencing walls, floor and fittings on site with your other contractors." },
    ],
  },
  {
    id: "flooring",
    anchor: "wooden-flooring",
    title: "Wooden Sports Flooring",
    summary: "Wooden sports floors for indoor courts and halls, selected for the activity and installed on a prepared base.",
    image: images.floorIndoorHall,
    intro: [
      "A sports floor affects how a court plays and how comfortable it is to play on. SS Infratech installs wooden sports flooring for indoor courts, multi-purpose halls, schools and clubs.",
      "The right floor depends on the sports played, the room and the base beneath it. Floor system, finish and maintenance requirements are confirmed for each project.",
    ],
    scopeHeading: "How a flooring project is scoped",
    scope: [
      { title: "Surface selection", text: "Choosing a floor system around the sports and use the hall will see." },
      { title: "Subfloor and site preparation", text: "Checking the base for level, moisture and soundness before laying." },
      { title: "Levelness and installation", text: "Laying and fixing the floor to the agreed tolerances." },
      { title: "Line marking and finishing", text: "Court markings and protective finish applied after installation." },
      { title: "Maintenance guidance", text: "Cleaning and upkeep advice to keep the floor in playing condition." },
      { title: "Project-specific quotation", text: "Pricing based on floor area, system and site conditions." },
    ],
  },
];

export const courtTypes = [
  { title: "Standard court", text: "Glass back walls with mesh-and-glass side walls. The most common configuration for clubs and facilities." },
  { title: "Panoramic-style court", text: "Fewer visible posts and more continuous glass, giving spectators a clearer view of play." },
  { title: "Indoor court", text: "Installed inside a building. Ceiling height, lighting and the existing floor shape the design." },
  { title: "Outdoor court", text: "Exposed to sun, rain and wind, so drainage, surface choice and finish matter more." },
  { title: "Single-court installation", text: "One court for a club, school, hotel or private property." },
  { title: "Multi-court facility", text: "Several courts planned together, sharing access, lighting and circulation space." },
];

/**
 * Specification sheet. `confirmed` holds a value SS Infratech has verified;
 * leave it undefined and the row reads "Confirmed in your quotation".
 */
export type SpecRow = { label: string; covers: string; confirmed?: string; source?: string };

export const padelSpecs: SpecRow[] = [
  {
    label: "Playing area",
    covers: "Internal dimensions of a doubles court",
    confirmed: "20 m × 10 m",
    source: "International Padel Federation rules",
  },
  { label: "Site footprint and clearance", covers: "Total area needed including surrounds and access" },
  { label: "Structure", covers: "Steel section, fabrication and protective finish" },
  { label: "Glass", covers: "Type, thickness and fixing method of wall panels" },
  { label: "Fencing", covers: "Mesh type, height and panel layout" },
  { label: "Playing surface", covers: "Turf or surface type, infill and line marking" },
  { label: "Lighting", covers: "Fixture count, mounting and coverage" },
  { label: "Foundation", covers: "Base slab requirements and responsibility" },
  { label: "Drainage", covers: "Falls and water management for outdoor courts" },
  { label: "Installation scope", covers: "What is supplied, installed and excluded" },
  { label: "Maintenance", covers: "Routine care for glass, turf and structure" },
];

export const installationSteps = [
  { title: "Enquiry and requirements", text: "You share the service you need, the site location and what you have in mind." },
  { title: "Preliminary discussion", text: "We talk through your goals, budget range and any constraints." },
  { title: "Site information and assessment", text: "Measurements, photos or a visit help us understand the ground or room." },
  { title: "Configuration and scope", text: "Court type, components and responsibilities are agreed." },
  { title: "Quotation and agreement", text: "You receive a written quotation; work begins once it's agreed." },
  { title: "Manufacturing and preparation", text: "Fabrication, procurement and site preparation, as applicable." },
  { title: "Site installation", text: "Our team assembles and installs on site." },
  { title: "Inspection and handover", text: "We inspect the finished work with you and hand it over." },
];

export const homeProcess = [
  { title: "Share your requirements", text: "Tell us what you want to build and where." },
  { title: "Discuss site and configuration", text: "We review site conditions and the court setup that fits." },
  { title: "Review scope and quotation", text: "You get a clear scope with a project-specific quotation." },
  { title: "Fabrication, supply and installation", text: "We coordinate manufacturing, delivery and on-site work." },
  { title: "Inspection and handover", text: "We check the finished work with you and hand it over." },
];

export const strengths = [
  { title: "Court manufacturing and installation", text: "One team takes the court from fabrication to installation, so fewer handovers between suppliers." },
  { title: "Built around structure", text: "Steel framing, glass fixing and alignment get close attention, because a court has to stay true for years of play." },
  { title: "Planned for your site", text: "Configuration, access and lighting are worked out around the actual ground or building." },
  { title: "Clear scope before work starts", text: "Inclusions, exclusions and civil-work responsibilities are written into the quotation." },
];
