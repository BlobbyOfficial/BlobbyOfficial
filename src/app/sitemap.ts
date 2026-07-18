import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const ROUTES = [
  { path: "", priority: 1.0 },
  { path: "/store", priority: 0.8 },
  { path: "/portfolio", priority: 0.8 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
  { path: "/faq", priority: 0.5 },
  { path: "/licensing", priority: 0.3 },
  { path: "/privacy-policy", priority: 0.2 },
  { path: "/terms-of-use", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    priority: route.priority,
  }));
}
