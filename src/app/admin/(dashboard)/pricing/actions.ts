"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

function revalidatePricingPages() {
  revalidatePath("/admin/pricing");
  revalidatePath("/");
  revalidatePath("/pricing");
}

function tierFromForm(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? ""),
    price_label: String(formData.get("price_label") ?? "$0"),
    price_note: String(formData.get("price_note") ?? ""),
    description: String(formData.get("description") ?? ""),
    cta_label: String(formData.get("cta_label") ?? "Get in touch"),
    cta_url: String(formData.get("cta_url") ?? "/contact"),
    highlighted: formData.get("highlighted") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
    published: formData.get("published") === "on",
  };
}

/**
 * Feature values are submitted as one input per tier, named `value:<slug>`,
 * and collected back into the jsonb map the table stores. Blank inputs are
 * dropped so an unfilled cell renders as a dash instead of a stored "".
 */
function featureFromForm(formData: FormData) {
  const values: Record<string, string> = {};

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("value:")) continue;
    const value = String(raw).trim();
    if (value) values[key.slice("value:".length)] = value;
  }

  return {
    label: String(formData.get("label") ?? ""),
    note: String(formData.get("note") ?? ""),
    values,
    sort_order: Number(formData.get("sort_order") ?? 0),
    published: formData.get("published") === "on",
  };
}

export async function createPricingTier(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_tiers").insert(tierFromForm(formData));
  revalidatePricingPages();
}

export async function updatePricingTier(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_tiers").update(tierFromForm(formData)).eq("id", id);
  revalidatePricingPages();
}

export async function deletePricingTier(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_tiers").delete().eq("id", id);
  revalidatePricingPages();
}

export async function createPricingFeature(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_features").insert(featureFromForm(formData));
  revalidatePricingPages();
}

export async function updatePricingFeature(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_features").update(featureFromForm(formData)).eq("id", id);
  revalidatePricingPages();
}

export async function deletePricingFeature(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("pricing_features").delete().eq("id", id);
  revalidatePricingPages();
}

export async function savePricingSettings(formData: FormData) {
  const { supabase } = await requireAdmin();

  // The settings row may not exist yet on a project migrated before the seed
  // ran, so upsert on the pinned id rather than update.
  await supabase.from("pricing_settings").upsert({
    id: 1,
    heading: String(formData.get("heading") ?? "Pricing"),
    subheading: String(formData.get("subheading") ?? ""),
    description: String(formData.get("description") ?? ""),
    payment_note: String(formData.get("payment_note") ?? ""),
    footnote: String(formData.get("footnote") ?? ""),
  });

  revalidatePricingPages();
}
