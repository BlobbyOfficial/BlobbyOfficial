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

/**
 * Deleting is deliberately still a plain table write: RLS restricts it to the
 * owner, so a collaborator who was given the link can edit but can't destroy
 * someone else's script.
 */
export async function deleteScript(id: string) {
  const supabase = await createClient();
  await supabase.from("bo_scripts").delete().eq("id", id);
  revalidatePath("/scripts");
  redirect("/scripts");
}

/**
 * Renaming and saving go through security-definer functions so that anyone
 * holding the share link can edit, without bo_scripts having to be readable
 * table-wide (which previously let any account dump everyone's scripts).
 */
export async function renameScript(id: string, title: string) {
  const supabase = await createClient();
  await supabase.rpc("bo_script_rename", { p_id: id, p_title: title });
  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
}

/** Persists the latest Yjs CRDT snapshot (base64) — called on a debounce
 * from the client as edits settle, not on every keystroke. */
export async function saveScriptContent(id: string, contentBase64: string) {
  const supabase = await createClient();
  await supabase.rpc("bo_script_save", { p_id: id, p_content: contentBase64 });
}
