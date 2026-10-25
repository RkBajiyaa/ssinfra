/** Public pages counted by analytics. Anything else (404s, admin) is ignored. */
export const TRACKED_PATHS = [
  "/",
  "/courts-solutions",
  "/projects",
  "/contact",
  "/about",
  "/privacy",
] as const;

export const PATH_LABELS: Record<string, string> = {
  "/": "Home",
  "/courts-solutions": "Courts & Solutions",
  "/projects": "Projects & Gallery",
  "/contact": "Contact",
  "/about": "About Us",
  "/privacy": "Privacy Policy",
};
