import type { StaticImageData } from "next/image";

import multiCourtDusk from "../../public/images/projects/padel-multi-court-facility-dusk.jpg";
import panoramicDusk from "../../public/images/projects/padel-court-panoramic-dusk.jpg";
import glassEnclosureEvening from "../../public/images/projects/padel-court-glass-enclosure-evening.jpg";
import steelFrameDetail from "../../public/images/projects/padel-court-steel-frame-detail.jpg";
import installationGlass from "../../public/images/projects/padel-court-installation-glass-panels.jpg";
import installationTeam from "../../public/images/projects/padel-court-installation-team.jpg";
import workshopAssembly from "../../public/images/projects/workshop-fabrication-assembly.jpg";
import squashGlassWall from "../../public/images/projects/squash-court-glass-back-wall.jpg";
import floorIndoorHall from "../../public/images/projects/wooden-sports-floor-indoor-hall.jpg";
import floorArena from "../../public/images/projects/wooden-sports-floor-arena.jpg";

/**
 * Every photograph used on the site, in one place. To replace a photo,
 * drop the new file in public/images/projects/ and change the import here;
 * width/height come from the file, so layouts don't shift.
 */
export type SiteImage = { src: StaticImageData; alt: string };

export const images = {
  multiCourtDusk: {
    src: multiCourtDusk,
    alt: "Multi-court padel facility at dusk with blue courts, black steel frames, glass walls and court lighting",
  },
  panoramicDusk: {
    src: panoramicDusk,
    alt: "Padel court with full-height glass walls, black steel structure and mesh upper panels at sunset",
  },
  glassEnclosureEvening: {
    src: glassEnclosureEvening,
    alt: "Corner view of a padel court glass enclosure with mesh fencing and floodlights in the evening",
  },
  steelFrameDetail: {
    src: steelFrameDetail,
    alt: "Close-up of a black steel padel court post with bolted glass clamps and welded mesh panels",
  },
  installationGlass: {
    src: installationGlass,
    alt: "Installers fixing tempered glass panels to a steel padel court frame on site",
  },
  installationTeam: {
    src: installationTeam,
    alt: "SS Infratech installation team mounting glass walls on a padel court with blue turf laid",
  },
  workshopAssembly: {
    src: workshopAssembly,
    alt: "Steel court frame being assembled and checked in the SS Infratech fabrication workshop",
  },
  squashGlassWall: {
    src: squashGlassWall,
    alt: "Squash court with white playing walls, red court lines, wooden floor and a glass back wall",
  },
  floorIndoorHall: {
    src: floorIndoorHall,
    alt: "Polished wooden sports floor in an indoor hall with court markings and large windows",
  },
  floorArena: {
    src: floorArena,
    alt: "Wooden sports flooring across a multi-purpose indoor court with basketball markings",
  },
} satisfies Record<string, SiteImage>;
