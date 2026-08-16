"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getMessagingSettings } from "@/lib/messaging";

export type SendMessageState = { error: string | null };

/** How long a thread has to be quiet before the auto-reply fires again. */
const AUTO_REPLY_QUIET_MS = 12 * 60 * 60 * 1000;

export async function sendMessage(
  _prevState: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  if (!isSupabaseConfigured()) {
    return { error: "Messaging isn't configured yet." };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be signed in to send a message." };

  const settings = await getMessagingSettings(supabase);
  if (!settings.enabled) return { error: settings.disabled_notice };
  if (body.length > settings.max_length) {
    return { error: `That message is too long - keep it under ${settings.max_length} characters.` };
  }

  // Checked here for a readable message; the insert trigger from migration
  // 0011 enforces it again so the rule can't be skipped by other clients.
  const { data: blocked } = await supabase.rpc("bo_am_i_blocked");
  if (blocked) {
    return { error: "You can no longer send messages here. Reach out on Discord instead." };
  }

  if (isRateLimited(user.id)) {
    return { error: "Too many messages sent - please try again in a minute." };
  }

  const { error } = await supabase.from("bo_messages").insert({
    user_id: user.id,
    user_email: user.email ?? "unknown",
    sender: "user",
    body,
  });

  if (error) {
    console.error("Failed to save message:", error);
    return { error: "Something went wrong on our end - please try again." };
  }

  await maybeAutoReply(supabase, user.id, settings.auto_reply_enabled, settings.auto_reply_body);

  revalidatePath("/contact");
  revalidatePath("/admin/messages");
  return { error: null };
}

/**
 * Answers on the admin's behalf when a thread has been quiet — so someone
 * writing in at 3am gets an acknowledgement rather than silence. Skipped when
 * the admin replied recently, to avoid talking over a live conversation.
 */
async function maybeAutoReply(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  enabled: boolean,
  autoReplyBody: string
) {
  if (!enabled || !autoReplyBody.trim()) return;

  const { data: lastAdmin } = await supabase
    .from("bo_messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("sender", "admin")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    lastAdmin &&
    Date.now() - new Date(lastAdmin.created_at).getTime() < AUTO_REPLY_QUIET_MS
  ) {
    return;
  }

  await supabase.from("bo_messages").insert({
    user_id: userId,
    user_email: "blobbyofficial",
    sender: "admin",
    body: autoReplyBody,
    read: true,
  });
}

/** Users can take back their own messages; the row stays as a tombstone. */
export async function deleteOwnMessage(id: string): Promise<SendMessageState> {
  if (!isSupabaseConfigured()) return { error: "Messaging isn't configured yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("bo_messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: "user" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("sender", "user")
    .is("deleted_at", null);

  if (error) return { error: "Couldn't delete that message." };

  revalidatePath("/contact");
  revalidatePath("/admin/messages");
  return { error: null };
}

/**
 * Clears the user's own side of the thread. The admin's replies are left
 * alone — they aren't the user's to remove — and nothing is hard-deleted, so
 * the record of the conversation survives on the admin side.
 */
export async function clearOwnMessages(): Promise<SendMessageState> {
  if (!isSupabaseConfigured()) return { error: "Messaging isn't configured yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("bo_messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: "user" })
    .eq("user_id", user.id)
    .eq("sender", "user")
    .is("deleted_at", null);

  if (error) return { error: "Couldn't clear your messages." };

  revalidatePath("/contact");
  revalidatePath("/admin/messages");
  return { error: null };
}
