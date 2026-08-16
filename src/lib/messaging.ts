import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoMessage, BoMessagingSettings, Database } from "@/lib/types";

export const DEFAULT_MESSAGING_SETTINGS: BoMessagingSettings = {
  id: 1,
  enabled: true,
  disabled_notice: "Messaging is paused right now - check back soon.",
  banner: "",
  max_length: 4000,
  auto_reply_enabled: false,
  auto_reply_body: "",
  updated_at: new Date(0).toISOString(),
};

/**
 * Reads the singleton settings row, falling back to defaults when the row (or
 * the whole table, on a deployment that hasn't run migration 0011) is
 * missing. Messaging staying up is worth more than the settings being exact.
 */
export async function getMessagingSettings(
  supabase: SupabaseClient<Database>
): Promise<BoMessagingSettings> {
  const { data } = await supabase.from("bo_messaging_settings").select("*").eq("id", 1).maybeSingle();
  return data ?? DEFAULT_MESSAGING_SETTINGS;
}

/** What a deleted message reads as once the body is gone. */
export const TOMBSTONE = {
  user: "This message was deleted by the sender.",
  admin: "This message was removed by blobbyofficial.",
} as const;

export function isDeleted(message: BoMessage): boolean {
  return message.deleted_at != null;
}

/** Plain-text transcript of a thread, used by the admin export action. */
export function formatTranscript(email: string, messages: BoMessage[]): string {
  const lines = [
    `Conversation with ${email}`,
    `Exported ${new Date().toISOString()}`,
    `${messages.length} message${messages.length === 1 ? "" : "s"}`,
    "",
  ];

  for (const msg of messages) {
    const who = msg.sender === "admin" ? "blobbyofficial" : msg.user_email;
    const body = isDeleted(msg) ? `[deleted by ${msg.deleted_by ?? "unknown"}]` : msg.body;
    lines.push(`[${new Date(msg.created_at).toISOString()}] ${who}:`, body, "");
  }

  return lines.join("\n");
}
