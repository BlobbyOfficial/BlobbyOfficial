"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

export type SendMessageState = { error: string | null };

export async function sendMessage(
  _prevState: SendMessageState,
  formData: FormData
): Promise<SendMessageState> {
  if (!isSupabaseConfigured()) {
    return { error: "Messaging isn't configured yet." };
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > 4000) return { error: "That message is too long - try trimming it down." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be signed in to send a message." };

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

  revalidatePath("/contact");
  revalidatePath("/admin/messages");
  return { error: null };
}
