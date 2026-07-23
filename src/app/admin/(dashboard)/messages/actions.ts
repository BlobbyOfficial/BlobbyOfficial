"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendAdminReply(userId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("bo_messages").insert({
    user_id: userId,
    user_email: user.email ?? "admin",
    sender: "admin",
    body,
  });

  revalidatePath("/admin/messages");
  revalidatePath("/contact");
}

export async function markConversationRead(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("bo_messages")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("sender", "user")
    .eq("read", false);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function markRead(id: string, read: boolean) {
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ read }).eq("id", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
  const supabase = await createClient();
  await supabase.from("contact_messages").delete().eq("id", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
