import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PortfolioClip, Product } from "@/lib/types";

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

const SEED_PORTFOLIO: PortfolioClip[] = [
  {
    id: "seed-clip-1",
    title: "TikTok edit 1",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/19hms66uuhjAZqoEFvYmg7btb3Xku7rz1/",
    sort_order: 0,
    published: true,
    created_at: "",
  },
  {
    id: "seed-clip-2",
    title: "TikTok edit 2",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/1LTuqS4n0Og72fY2FbpwSBmjbz7t7-IZG/",
    sort_order: 1,
    published: true,
    created_at: "",
  },
  {
    id: "seed-clip-3",
    title: "TikTok edit 3",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/1U5KJM6V3nt8hARxp0R60BIiJ1sUwd8uC/",
    sort_order: 2,
    published: true,
    created_at: "",
  },
  {
    id: "seed-clip-4",
    title: "TikTok edit 4",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/1C6fAmte9Ed9R2QjjfnD2eodTNcObqn3E/",
    sort_order: 3,
    published: true,
    created_at: "",
  },
  {
    id: "seed-clip-5",
    title: "TikTok edit 5",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/1YlMdc9chtr4SVSnyQcofyjXmudEKEEu6/",
    sort_order: 4,
    published: true,
    created_at: "",
  },
  {
    id: "seed-clip-6",
    title: "TikTok edit 6",
    category: "tiktok",
    video_url: "https://drive.google.com/file/d/1OIj_ws1LTWSsIk0sJzA1cW9uEy9bveD0/",
    sort_order: 5,
    published: true,
    created_at: "",
  },
];

export const PORTFOLIO_STATS = [
  { platform: "TikTok", value: "2186", label: "Followers" },
  { platform: "TikTok", value: "32.2K", label: "Total Likes" },
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

  if (error || !data || data.length === 0) return SEED_PORTFOLIO;
  return data;
}
