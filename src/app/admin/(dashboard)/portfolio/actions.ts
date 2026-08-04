"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { syncPortfolioVideos } from "@/lib/portfolio-sync";

function revalidateClipPages() {
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  revalidatePath("/portfolio");
}

/**
 * Clips are never created by hand from the dashboard — this pulls in whatever
 * is sitting in public/media/videos and adds the new ones as private.
 */
export async function syncClips() {
  await requireAdmin();
  await syncPortfolioVideos();
  revalidateClipPages();
}

export async function updateClip(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const rating = String(formData.get("review_rating") ?? "");
  await supabase
    .from("portfolio_clips")
    .update({
      title: String(formData.get("title") ?? ""),
      category: formData.get("category") === "clients" ? "clients" : "tiktok",
      sort_order: Number(formData.get("sort_order") ?? 0),
      published: formData.get("published") === "on",
      review_rating: rating ? Number(rating) : null,
      review_comment: String(formData.get("review_comment") ?? "") || null,
      review_discord_username: String(formData.get("review_discord_username") ?? "") || null,
    })
    .eq("id", id);
  revalidateClipPages();
}

export async function deleteClip(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("portfolio_clips").delete().eq("id", id);
  revalidateClipPages();
}

export async function toggleSectionVisibility(category: "tiktok" | "clients", hidden: boolean) {
  const { supabase } = await requireAdmin();
  await supabase.from("portfolio_section_visibility").upsert({ category, hidden });
  revalidateClipPages();
}
