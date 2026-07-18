"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseTags(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function productFromForm(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    tags: parseTags(formData.get("tags")),
    preview_image_url: String(formData.get("preview_image_url") ?? ""),
    buy_url: String(formData.get("buy_url") ?? ""),
    price_label: String(formData.get("price_label") ?? "Free"),
    sort_order: Number(formData.get("sort_order") ?? 0),
    published: formData.get("published") === "on",
  };
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("products").insert(productFromForm(formData));
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/store");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("products").update(productFromForm(formData)).eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/store");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/store");
}
