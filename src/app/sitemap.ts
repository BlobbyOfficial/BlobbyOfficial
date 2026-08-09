import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `changeFrequency` is a hint about how often the page's content actually
 * moves — the store and portfolio change when clips and presets are added,
 * the legal pages effectively never do.
 */
const ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/store", priority: 0.8, changeFrequency: "weekly" },
  { path: "/portfolio", priority: 0.8, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/licensing", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-use", priority: 0.2, changeFrequency: "yearly" },
] as const;

/**
 * Pinned to build time rather than request time. `new Date()` here meant
 * every page claimed to have been modified the instant the sitemap was
 * fetched, which is never true and which crawlers learn to discount — a
 * deploy is the only thing that actually changes these pages.
 */
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
