"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { formatTranscript, getMessagingSettings } from "@/lib/messaging";

function revalidateMessagePages() {
  revalidatePath("/admin/messages");
  revalidatePath("/admin/messages/blocks");
  revalidatePath("/admin/messages/settings");
  revalidatePath("/admin");
  revalidatePath("/contact");
}

/** Every mutation returns this so the client can surface a real error. */
export type ActionResult = { ok: boolean; error: string | null; message?: string };

const OK: ActionResult = { ok: true, error: null };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

/**
 * Wraps an action body so a thrown error (not signed in, not an admin, a
 * Postgres constraint) becomes a message the dashboard can render instead of
 * a blank error overlay.
 */
async function guarded(run: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await run();
  } catch (error) {
    console.error("Admin messaging action failed:", error);
    return fail(error instanceof Error ? error.message : "Something went wrong.");
  }
}

// ── REPLYING ───────────────────────────────────────────────────────────────

export async function sendAdminReply(userId: string, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return fail("Write a reply first.");
    if (body.length > 4000) return fail("That reply is too long.");

    const { supabase, user } = await requireAdmin();

    const { error } = await supabase.from("bo_messages").insert({
      user_id: userId,
      user_email: user.email ?? "admin",
      sender: "admin",
      body,
    });
    if (error) return fail(error.message);

    // Replying is an implicit "I've seen this".
    await supabase
      .from("bo_messages")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("sender", "user")
      .eq("read", false);

    revalidateMessagePages();
    return OK;
  });
}

/**
 * Sends one message to every user who has ever written in, optionally only
 * to threads that aren't archived. Inserted one row per thread so each user
 * sees it in their own conversation.
 */
export async function broadcast(formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const body = String(formData.get("body") ?? "").trim();
    const skipArchived = formData.get("skip_archived") === "on";
    if (!body) return fail("Write a message first.");

    const { supabase, user } = await requireAdmin();

    const [{ data: rows }, { data: conversations }, { data: blocks }] = await Promise.all([
      supabase.from("bo_messages").select("user_id"),
      supabase.from("bo_conversations").select("user_id, archived"),
      supabase.from("bo_blocks").select("user_id"),
    ]);

    const archived = new Set(
      (conversations ?? []).filter((c) => c.archived).map((c) => c.user_id)
    );
    const blocked = new Set((blocks ?? []).map((b) => b.user_id).filter(Boolean) as string[]);

    const targets = Array.from(new Set((rows ?? []).map((r) => r.user_id))).filter(
      (id) => !blocked.has(id) && !(skipArchived && archived.has(id))
    );

    if (targets.length === 0) return fail("No conversations to broadcast to.");

    const { error } = await supabase.from("bo_messages").insert(
      targets.map((id) => ({
        user_id: id,
        user_email: user.email ?? "admin",
        sender: "admin" as const,
        body,
      }))
    );
    if (error) return fail(error.message);

    revalidateMessagePages();
    return { ok: true, error: null, message: `Sent to ${targets.length} conversation(s).` };
  });
}

// ── READ STATE ─────────────────────────────────────────────────────────────

export async function markConversationRead(userId: string, read = true): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    await supabase
      .from("bo_messages")
      .update({ read })
      .eq("user_id", userId)
      .eq("sender", "user");
    revalidateMessagePages();
    return OK;
  });
}

export async function markAllRead(): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    await supabase.from("bo_messages").update({ read: true }).eq("sender", "user").eq("read", false);
    revalidateMessagePages();
    return OK;
  });
}

// ── MESSAGE-LEVEL CONTROLS ─────────────────────────────────────────────────

/** Soft delete: the row stays, the body is replaced by a tombstone. */
export async function deleteAdminMessage(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("bo_messages")
      .update({ deleted_at: new Date().toISOString(), deleted_by: "admin" })
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Hard delete of a single row — used to clear a tombstone for good. */
export async function purgeMessage(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("bo_messages").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

export async function restoreMessage(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("bo_messages")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

export async function setMessagePinned(id: string, pinned: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("bo_messages").update({ pinned }).eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Admins can correct their own replies (typos, wrong price). */
export async function editAdminMessage(id: string, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return fail("A message can't be empty - delete it instead.");
    if (body.length > 4000) return fail("That message is too long.");

    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("bo_messages")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", id)
      .eq("sender", "admin");
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

// ── CONVERSATION-LEVEL CONTROLS ────────────────────────────────────────────

async function upsertConversation(
  userId: string,
  patch: Record<string, unknown>
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bo_conversations")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
  if (error) return fail(error.message);
  revalidateMessagePages();
  return OK;
}

export async function setConversationFlag(
  userId: string,
  flag: "pinned" | "archived" | "starred",
  value: boolean
): Promise<ActionResult> {
  return guarded(() => upsertConversation(userId, { [flag]: value }));
}

export async function setConversationMeta(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  return guarded(() =>
    upsertConversation(userId, {
      label: String(formData.get("label") ?? "").trim().slice(0, 40),
      note: String(formData.get("note") ?? "").trim().slice(0, 2000),
    })
  );
}

/** Soft-deletes every message in a thread — both sides of it. */
export async function clearConversation(userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("bo_messages")
      .update({ deleted_at: new Date().toISOString(), deleted_by: "admin" })
      .eq("user_id", userId)
      .is("deleted_at", null);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Hard delete of the whole thread, via the admin-only definer function. */
export async function deleteConversation(userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc("bo_purge_conversation", { p_user_id: userId });
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Removes every tombstone older than `days` across all threads. */
export async function purgeDeleted(formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const days = Number(formData.get("days") ?? 0);
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.rpc("bo_purge_deleted", {
      p_days: Number.isFinite(days) ? Math.max(0, Math.trunc(days)) : 0,
    });
    if (error) return fail(error.message);
    revalidateMessagePages();
    return { ok: true, error: null, message: `Removed ${data ?? 0} deleted message(s).` };
  });
}

/** Returns a plain-text transcript for the client to download. */
export async function exportConversation(
  userId: string
): Promise<{ ok: boolean; error: string | null; filename?: string; content?: string }> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("bo_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };

    const messages = data ?? [];
    const email = messages[0]?.user_email ?? userId;
    return {
      ok: true,
      error: null,
      filename: `conversation-${email.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`,
      content: formatTranscript(email, messages),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Export failed." };
  }
}

// ── BLOCKS ─────────────────────────────────────────────────────────────────

export async function blockUser(formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const userId = String(formData.get("user_id") ?? "").trim() || null;
    const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
    const email = emailRaw || null;
    const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

    if (!userId && !email) return fail("Give an account or an email address to block.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("That doesn't look like an email address.");
    }

    const { supabase, user } = await requireAdmin();

    if (userId === user.id) return fail("You can't block your own account.");

    const { error } = await supabase
      .from("bo_blocks")
      .insert({ user_id: userId, email, reason, created_by: user.id });

    // 23505 = unique violation: the target is already blocked, which is the
    // state the admin asked for, so report it as a no-op rather than a failure.
    if (error && error.code !== "23505") return fail(error.message);

    revalidateMessagePages();
    return OK;
  });
}

export async function unblock(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("bo_blocks").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Blocks both the account and the address behind a conversation at once. */
export async function blockConversation(
  userId: string,
  email: string,
  formData: FormData
): Promise<ActionResult> {
  const reason = String(formData.get("reason") ?? "");
  const payload = new FormData();
  payload.set("user_id", userId);
  payload.set("email", email);
  payload.set("reason", reason);
  return blockUser(payload);
}

export async function unblockConversation(userId: string, email: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    await supabase.from("bo_blocks").delete().eq("user_id", userId);
    if (email) await supabase.from("bo_blocks").delete().ilike("email", email);
    revalidateMessagePages();
    return OK;
  });
}

// ── SETTINGS ───────────────────────────────────────────────────────────────

export async function updateMessagingSettings(formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();

    const maxLengthRaw = Number(formData.get("max_length") ?? 4000);
    const maxLength = Number.isFinite(maxLengthRaw)
      ? Math.min(4000, Math.max(100, Math.trunc(maxLengthRaw)))
      : 4000;

    const { error } = await supabase.from("bo_messaging_settings").upsert({
      id: 1,
      enabled: formData.get("enabled") === "on",
      disabled_notice: String(formData.get("disabled_notice") ?? "").slice(0, 500),
      banner: String(formData.get("banner") ?? "").slice(0, 500),
      max_length: maxLength,
      auto_reply_enabled: formData.get("auto_reply_enabled") === "on",
      auto_reply_body: String(formData.get("auto_reply_body") ?? "").slice(0, 2000),
      updated_at: new Date().toISOString(),
    });
    if (error) return fail(error.message);

    revalidateMessagePages();
    return OK;
  });
}

// ── CANNED REPLIES ─────────────────────────────────────────────────────────

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const title = String(formData.get("title") ?? "").trim().slice(0, 80);
    const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
    if (!title || !body) return fail("A template needs both a title and a body.");

    const { supabase } = await requireAdmin();
    const sortOrder = Number(formData.get("sort_order") ?? 0);
    const { error } = await supabase.from("bo_message_templates").insert({
      title,
      body,
      sort_order: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    });
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("bo_message_templates").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

// ── LEGACY CONTACT FORM ────────────────────────────────────────────────────
// The anonymous contact form was replaced by the account inbox in 0005; these
// two keep the remaining rows manageable until they're all cleared out.

export async function markRead(id: string, read: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("contact_messages").update({ read }).eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidateMessagePages();
    return OK;
  });
}

/** Read helper the settings page uses to render current values. */
export async function readMessagingSettings() {
  const { supabase } = await requireAdmin();
  return getMessagingSettings(supabase);
}
