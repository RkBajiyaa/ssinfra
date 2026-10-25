import { images, type SiteImage } from "./images";

export const GALLERY_CATEGORIES = [
  { id: "padel", label: "Padel Courts" },
  { id: "squash", label: "Squash Courts" },
  { id: "flooring", label: "Wooden Sports Flooring" },
  { id: "manufacturing", label: "Manufacturing & Dispatch" },
  { id: "installation", label: "Installation in Progress" },
] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]["id"];

export type GalleryItem = {
  id: string;
  title: string;
  category: GalleryCategory;
  image: SiteImage;
  more?: SiteImage[];
  /** Only fill in once the owner confirms it can be published. */
  location?: string;
  description: string;
  status?: "completed" | "in_progress";
  order: number;
  published: boolean;
};

/*
 * Titles describe what the photograph shows. Project names, client names
 * and locations are left out until the owner confirms them.
 */
export const gallery: GalleryItem[] = [
  {
    id: "multi-court-facility",
    title: "Multi-court padel facility",
    category: "padel",
    image: images.multiCourtDusk,
    description: "Several blue-turf padel courts with steel framing, glass walls and court lighting, laid out as one facility.",
    status: "completed",
    order: 1,
    published: true,
  },
  {
    id: "panoramic-court",
    title: "Glass and steel padel court",
    category: "padel",
    image: images.panoramicDusk,
    more: [images.glassEnclosureEvening],
    description: "Full-height glass walls on a black steel structure, with mesh upper panels and floodlights.",
    status: "completed",
    order: 2,
    published: true,
  },
  {
    id: "frame-detail",
    title: "Structural frame and glass fixings",
    category: "padel",
    image: images.steelFrameDetail,
    description: "Bolted glass clamps, welded mesh panels and powder-coated posts up close.",
    status: "completed",
    order: 3,
    published: true,
  },
  {
    id: "squash-court",
    title: "Squash court with glass back wall",
    category: "squash",
    image: images.squashGlassWall,
    description: "White playing walls, a wooden floor and a glass back wall with access door.",
    status: "completed",
    order: 4,
    published: true,
  },
  {
    id: "indoor-hall-floor",
    title: "Indoor hall sports floor",
    category: "flooring",
    image: images.floorIndoorHall,
    more: [images.floorArena],
    description: "Wooden sports flooring with court markings across a multi-purpose indoor hall.",
    status: "completed",
    order: 5,
    published: true,
  },
  {
    id: "workshop-assembly",
    title: "Frame assembly in the workshop",
    category: "manufacturing",
    image: images.workshopAssembly,
    description: "Court frames are assembled and checked in the workshop before dispatch to site.",
    order: 6,
    published: true,
  },
  {
    id: "glass-installation",
    title: "Glass panel installation",
    category: "installation",
    image: images.installationGlass,
    description: "Tempered glass panels being fixed to the steel frame on site.",
    status: "in_progress",
    order: 7,
    published: true,
  },
  {
    id: "team-on-site",
    title: "Installation team on site",
    category: "installation",
    image: images.installationTeam,
    description: "The installation team mounting glass walls after the playing surface has been laid.",
    status: "in_progress",
    order: 8,
    published: true,
  },
];

export const publishedGallery = gallery
  .filter((g) => g.published)
  .sort((a, b) => a.order - b.order);

/** Only categories that actually have photos are offered as filters. */
export const activeGalleryCategories = GALLERY_CATEGORIES.filter((c) =>
  publishedGallery.some((g) => g.category === c.id),
);
