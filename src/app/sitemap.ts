import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/courts-solutions", priority: 0.9 },
    { path: "/projects", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/about", priority: 0.6 },
    { path: "/privacy", priority: 0.2 },
  ];
  return pages.map((p) => ({ url: `${site.url}${p.path}`, changeFrequency: "monthly", priority: p.priority }));
}
