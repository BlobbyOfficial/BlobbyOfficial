import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const AI_TRAINING_BOTS = ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "Applebot-Extended"];
const SEO_SCRAPERS = ["AhrefsBot", "SemrushBot", "DotBot", "MJ12bot", "BLEXBot"];

/**
 * Account and session routes are thin, sign-in gated, or per-user — none of
 * them belong in an index. They're listed here as well as being marked
 * noindex in their own metadata: robots.txt stops the crawl, the meta tag
 * covers anything already discovered through a shared link.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/scripts",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      ...AI_TRAINING_BOTS.map((agent) => ({ userAgent: agent, disallow: "/" })),
      ...SEO_SCRAPERS.map((agent) => ({ userAgent: agent, allow: "/$", disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
