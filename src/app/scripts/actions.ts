"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createScript(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/scripts");

  const title = String(formData.get("title") ?? "").trim() || "Untitled script";

  const { data, error } = await supabase
    .from("bo_scripts")
    .insert({ owner_id: user.id, title })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/scripts");
  redirect(`/scripts/${data.id}`);
}

export async function deleteScript(id: string) {
  const supabase = await createClient();
  await supabase.from("bo_scripts").delete().eq("id", id);
  revalidatePath("/scripts");
  redirect("/scripts");
}

export async function renameScript(id: string, title: string) {
  const supabase = await createClient();
  await supabase
    .from("bo_scripts")
    .update({ title: title.trim() || "Untitled script", updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
}

/** Persists the latest Yjs CRDT snapshot (base64) — called on a debounce
 * from the client as edits settle, not on every keystroke. */
export async function saveScriptContent(id: string, contentBase64: string) {
  const supabase = await createClient();
  await supabase
    .from("bo_scripts")
    .update({ content: contentBase64, updated_at: new Date().toISOString() })
    .eq("id", id);
}
