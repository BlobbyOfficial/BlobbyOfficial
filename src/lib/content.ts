import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { VIDEO_MANIFEST } from "@/lib/video-manifest";
import type {
  PortfolioCategory,
  PortfolioClip,
  PricingFeature,
  PricingSettings,
  PricingTier,
  Product,
} from "@/lib/types";

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

/**
 * Pricing seed mirrors supabase/migrations/0010_pricing.sql so the page is
 * complete before the project is wired to Supabase. Once it is, the
 * pricing_* tables (managed from /admin/pricing) are the source of truth.
 */
const SEED_PRICING_SETTINGS: PricingSettings = {
  id: 1,
  heading: "Pricing",
  subheading: "per video",
  description:
    "One price per video, no retainers and no subscriptions. Pick the tier that matches the edit you need.",
  payment_note:
    "Payment is Discord Nitro only - $10 is one month of Nitro, $100 is a year. Gift it to me on Discord once the edit is approved.",
  footnote:
    "Prices are per finished video. Anything outside these tiers, message me and we will work it out.",
  updated_at: "",
};

const SEED_PRICING_TIERS: PricingTier[] = [
  {
    id: "seed-tier-free",
    slug: "free",
    name: "Free",
    price_label: "$0",
    price_note: "No payment",
    description: "A short edit when I have time free. Great for a first test run.",
    cta_label: "Ask for a free edit",
    cta_url: "/contact",
    highlighted: false,
    sort_order: 0,
    published: true,
    created_at: "",
  },
  {
    id: "seed-tier-short",
    slug: "short",
    name: "Short",
    price_label: "$10",
    price_note: "1 month of Discord Nitro",
    description: "Short-form edits with a deadline you set and a proper revision pass.",
    cta_label: "Book a short edit",
    cta_url: "/contact",
    highlighted: true,
    sort_order: 1,
    published: true,
    created_at: "",
  },
  {
    id: "seed-tier-longform",
    slug: "longform",
    name: "Longform",
    price_label: "$100",
    price_note: "1 year of Discord Nitro",
    description: "Full longform edits - YouTube videos, montages and client work.",
    cta_label: "Book a longform edit",
    cta_url: "/contact",
    highlighted: false,
    sort_order: 2,
    published: true,
    created_at: "",
  },
];

const SEED_PRICING_FEATURES: PricingFeature[] = (
  [
    ["Deadline", "Whether you can hold me to a delivery date", ["no", "yes", "yes"]],
    ["Max length", "Length of the finished video", ["30 seconds", "90 seconds", "15 minutes"]],
    ["Revisions", "Rounds of changes after the first cut", ["1", "3", "Unlimited"]],
    ["Typical turnaround", "From footage received to first cut", ["Whenever I am free", "3-5 days", "1-2 weeks"]],
    ["Queue priority", "Where your edit sits in the queue", ["Last", "Normal", "First"]],
    ["Colour grading", "", ["no", "yes", "yes"]],
    ["Sound design & SFX", "", ["Basic", "Full", "Full"]],
    ["Motion graphics & VFX", "", ["no", "Light", "Advanced"]],
    ["Captions & subtitles", "", ["yes", "yes", "yes"]],
    ["Export quality", "", ["1080p", "1080p", "Up to 4K"]],
    ["Custom thumbnail", "", ["no", "no", "yes"]],
    ["Project file included", "The DaVinci Resolve project, not just the export", ["no", "no", "yes"]],
    ["Commercial use", "Use the edit for sponsored or paid content", ["no", "yes", "yes"]],
    ["Credit required", "Whether you have to credit me in the description", ["yes", "Optional", "Optional"]],
  ] as const
).map(([label, note, [free, short, longform]], index) => ({
  id: `seed-feature-${index}`,
  label,
  note,
  values: { free, short, longform },
  sort_order: index,
  published: true,
  created_at: "",
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

/**
 * `values` is jsonb, so anything could be in there — coerce it to a flat
 * string map rather than trusting the column's shape at render time.
 */
function normaliseFeatureValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([slug, value]) => [slug, String(value ?? "")])
  );
}

export async function getPricingTiers(): Promise<PricingTier[]> {
  if (!isSupabaseConfigured()) return SEED_PRICING_TIERS;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_tiers")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) return SEED_PRICING_TIERS;
  return data;
}

export async function getPricingFeatures(): Promise<PricingFeature[]> {
  if (!isSupabaseConfigured()) return SEED_PRICING_FEATURES;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_features")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return SEED_PRICING_FEATURES;
  // Unlike the tiers, an empty feature list is a legitimate state: the tier
  // cards still make sense on their own with the comparison table removed.
  return data.map((row) => ({ ...row, values: normaliseFeatureValues(row.values) }));
}

export async function getPricingSettings(): Promise<PricingSettings> {
  if (!isSupabaseConfigured()) return SEED_PRICING_SETTINGS;

  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_settings").select("*").eq("id", 1).maybeSingle();

  if (error || !data) return SEED_PRICING_SETTINGS;
  return data;
}
