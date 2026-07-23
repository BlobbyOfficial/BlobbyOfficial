"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createClip(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("portfolio_clips").insert({
    title: String(formData.get("title") ?? ""),
    category: formData.get("category") === "clients" ? "clients" : "tiktok",
    video_url: String(formData.get("video_url") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 0),
    published: formData.get("published") === "on",
  });
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  revalidatePath("/portfolio");
}

export async function updateClip(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("portfolio_clips")
    .update({
      title: String(formData.get("title") ?? ""),
      category: formData.get("category") === "clients" ? "clients" : "tiktok",
      video_url: String(formData.get("video_url") ?? ""),
      sort_order: Number(formData.get("sort_order") ?? 0),
      published: formData.get("published") === "on",
    })
    .eq("id", id);
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  revalidatePath("/portfolio");
}

export async function deleteClip(id: string) {
  const supabase = await createClient();
  await supabase.from("portfolio_clips").delete().eq("id", id);
  revalidatePath("/admin/portfolio");
  revalidatePath("/");
  revalidatePath("/portfolio");
}
