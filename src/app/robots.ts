import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const AI_TRAINING_BOTS = ["GPTBot", "Google-Extended", "CCBot", "ClaudeBot", "Applebot-Extended"];
const SEO_SCRAPERS = ["AhrefsBot", "SemrushBot", "DotBot", "MJ12bot", "BLEXBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
      ...AI_TRAINING_BOTS.map((agent) => ({ userAgent: agent, disallow: "/" })),
      ...SEO_SCRAPERS.map((agent) => ({ userAgent: agent, allow: "/$", disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
