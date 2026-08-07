import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { VIDEO_MANIFEST } from "@/lib/video-manifest";
import type { PortfolioCategory, PortfolioClip, Product } from "@/lib/types";

/**
 * Seed content mirrors what shipped in the original static site. It renders
 * by default so the site looks complete out of the box; once Supabase is
 * configured and seeded (see supabase/migrations), these rows become the
 * source of truth and are managed from /admin instead of code.
 */
const SEED_PRODUCTS: Product[] = [
  {
    id: "seed-edge-reflect",
    slug: "edge-reflect",
    name: "Edge Reflect",
    description:
      "A simple preset to stop black borders appearing when tracking footage. Created for TikTok edits.",
    tags: ["DaVinci (free)", "Edits", ".setting"],
    preview_image_url: "/media/images/store/edge_reflect/1080x1080.png",
    buy_url: "https://payhip.com/buy?s=1&cart_links%5B%5D=k1u2c&qty%5Bk1u2c%5D=1",
    price_label: "Free",
    sort_order: 0,
    published: true,
    created_at: "",
  },
  {
    id: "seed-halo-blur",
    slug: "halo-blur",
    name: "Halo Blur",
    description:
      "A simple preset to create a halo blur effect, similar to CapCut. Great for edit transitions.",
    tags: ["DaVinci (free)", "Edits", ".drfx"],
    preview_image_url: "/media/images/store/halo_blur/1920x1080.png",
    buy_url: "https://payhip.com/buy?s=1&cart_links%5B%5D=DkQzA&qty%5BDkQzA%5D=1",
    price_label: "Free",
    sort_order: 1,
    published: true,
    created_at: "",
  },
  {
    id: "seed-handbrake-preset",
    slug: "handbrake-tiktok-1080-quality",
    name: "HandBrake Preset",
    description:
      "The settings I use to compress the final edit to reduce upload times and minimise TikTok's compression.",
    tags: ["HandBrake", "Edits", ".json"],
    preview_image_url: "/media/images/store/handbrake_tiktok_1080_quality/1920x1080.png",
    buy_url: "https://payhip.com/buy?s=1&cart_links%5B%5D=vwU7j&qty%5BvwU7j%5D=1",
    price_label: "Free",
    sort_order: 2,
    published: true,
    created_at: "",
  },
];

/**
 * Portfolio seed comes straight from the files in public/media/videos — the
 * filename is the clip title. This is only used when Supabase isn't
 * configured; once it is, portfolio_clips (managed from /admin) wins.
 */
const SEED_PORTFOLIO: PortfolioClip[] = VIDEO_MANIFEST.map((entry) => ({
  id: `seed-${entry.video_url}`,
  title: entry.title,
  category: entry.category,
  video_url: entry.video_url,
  sort_order: entry.sort_order,
  published: true,
  created_at: "",
  review_rating: null,
  review_comment: null,
  review_discord_username: null,
}));

export const PORTFOLIO_STATS = [
  { platform: "Discord", value: "15+", label: "Happy Clients" },
  { platform: "Online", value: "70+", label: "Videos Edited" },
  { platform: "TikTok", value: "510.6K", label: "Most Viewed Video" },
] as const;

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return SEED_PRODUCTS;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return SEED_PRODUCTS;
  return data;
}

export async function getPortfolioClips(): Promise<PortfolioClip[]> {
  if (!isSupabaseConfigured()) return SEED_PORTFOLIO;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_clips")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  // Only fall back to the seed on a hard failure: an empty result is a
  // legitimate state now that clips are added as private and only appear once
  // they're published from /admin.
  if (error) return SEED_PORTFOLIO;
  return data ?? [];
}

export async function getHiddenPortfolioSections(): Promise<Set<PortfolioCategory>> {
  if (!isSupabaseConfigured()) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase.from("portfolio_section_visibility").select("*");

  if (error || !data) return new Set();
  return new Set(data.filter((row) => row.hidden).map((row) => row.category));
}
