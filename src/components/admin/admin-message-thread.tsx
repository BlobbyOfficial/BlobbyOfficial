"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  blockConversation,
  clearConversation,
  deleteAdminMessage,
  deleteConversation,
  editAdminMessage,
  exportConversation,
  markConversationRead,
  purgeMessage,
  restoreMessage,
  sendAdminReply,
  setConversationFlag,
  setConversationMeta,
  setMessagePinned,
  unblockConversation,
  type ActionResult,
} from "@/app/admin/(dashboard)/messages/actions";
import { TOMBSTONE } from "@/lib/messaging";
import type { BoConversation, BoMessage, BoMessageTemplate } from "@/lib/types";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

const TOOL_CLASS =
  "text-[10px] tracking-[0.08em] uppercase text-mid transition-colors hover:text-fg disabled:opacity-40";

export function AdminMessageThread({
  userId,
  userEmail,
  initialMessages,
  conversation,
  templates,
  blocked,
}: {
  userId: string;
  userEmail: string;
  initialMessages: BoMessage[];
  conversation: BoConversation | null;
  templates: BoMessageTemplate[];
  blocked: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-sync when the server sends a fresh copy (after any action revalidates
  // the page). React's documented "adjust state when a prop changes" pattern —
  // doing it in an effect would render the stale list first.
  const [lastServerCopy, setLastServerCopy] = useState(initialMessages);
  if (initialMessages !== lastServerCopy) {
    setLastServerCopy(initialMessages);
    setMessages(initialMessages);
  }

  useEffect(() => {
    markConversationRead(userId);
  }, [userId]);

  // Realtime covers inserts (a new incoming message) and updates (either side
  // deleting or editing one) so an open dashboard doesn't drift from the DB.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin:bo_messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bo_messages", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            setMessages((prev) => prev.filter((m) => m.id !== old.id));
            return;
          }
          const row = payload.new as BoMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev.map((m) => (m.id === row.id ? row : m))
              : [...prev, row]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /** Runs a server action and surfaces its error instead of swallowing it. */
  const run = (action: () => Promise<ActionResult>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  };

  const replyAction = async (formData: FormData) => {
    const result = await sendAdminReply(userId, formData);
    setError(result.ok ? null : result.error);
    if (result.ok) formRef.current?.reset();
  };

  const insertTemplate = (body: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.value = textarea.value ? `${textarea.value.trimEnd()}\n\n${body}` : body;
    textarea.focus();
  };

  const download = () => {
    setError(null);
    startTransition(async () => {
      const result = await exportConversation(userId);
      if (!result.ok || !result.content) {
        setError(result.error ?? "Export failed.");
        return;
      }
      const url = URL.createObjectURL(new Blob([result.content], { type: "text/plain" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename ?? "conversation.txt";
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const visible = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const pinnedMessages = visible.filter((m) => m.pinned && !m.deleted_at);

  return (
    <div className="border border-border flex flex-col">
      {/* ── Thread toolbar ─────────────────────────────────────────────── */}
      <div className="border-b border-border px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[13px] text-fg truncate">{userEmail}</p>
            <p className="text-[10px] text-dim tracking-[0.08em] uppercase">
              {visible.length} message{visible.length === 1 ? "" : "s"}
              {conversation?.label ? ` · ${conversation.label}` : ""}
              {blocked ? " · blocked" : ""}
            </p>
          </div>
          <button type="button" className={TOOL_CLASS} onClick={() => setShowTools((v) => !v)}>
            {showTools ? "Hide controls" : "Controls"}
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            className={TOOL_CLASS}
            disabled={pending}
            onClick={() =>
              run(() => setConversationFlag(userId, "pinned", !conversation?.pinned))
            }
          >
            {conversation?.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            className={TOOL_CLASS}
            disabled={pending}
            onClick={() =>
              run(() => setConversationFlag(userId, "starred", !conversation?.starred))
            }
          >
            {conversation?.starred ? "Unstar" : "Star"}
          </button>
          <button
            type="button"
            className={TOOL_CLASS}
            disabled={pending}
            onClick={() =>
              run(() => setConversationFlag(userId, "archived", !conversation?.archived))
            }
          >
            {conversation?.archived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            className={TOOL_CLASS}
            disabled={pending}
            onClick={() => run(() => markConversationRead(userId, false))}
          >
            Mark unread
          </button>
          <button type="button" className={TOOL_CLASS} disabled={pending} onClick={download}>
            Export
          </button>
        </div>

        {showTools && (
          <div className="flex flex-col gap-4 pt-2 border-t border-border">
            <form
              action={(formData) => run(() => setConversationMeta(userId, formData))}
              className="flex flex-col gap-2"
            >
              <input
                name="label"
                defaultValue={conversation?.label ?? ""}
                maxLength={40}
                placeholder="Label (e.g. client, lead, support)"
                className="bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover"
              />
              <textarea
                name="note"
                rows={2}
                maxLength={2000}
                defaultValue={conversation?.note ?? ""}
                placeholder="Private note - only you can see this"
                className="bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover resize-y"
              />
              <SubmitButton label="Save details" pendingLabel="Saving…" />
            </form>

            {blocked ? (
              <button
                type="button"
                className={TOOL_CLASS}
                disabled={pending}
                onClick={() => run(() => unblockConversation(userId, userEmail))}
              >
                Unblock {userEmail}
              </button>
            ) : (
              <form
                action={(formData) => run(() => blockConversation(userId, userEmail, formData))}
                className="flex flex-col gap-2"
              >
                <input
                  name="reason"
                  maxLength={500}
                  placeholder="Reason for blocking (optional)"
                  className="bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover"
                />
                <button type="submit" className="text-[11px] text-red-400 self-start">
                  Block account + email
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                className="text-[10px] tracking-[0.08em] uppercase text-red-400/80 hover:text-red-400"
                disabled={pending}
                onClick={() =>
                  run(
                    () => clearConversation(userId),
                    `Delete every message in the thread with ${userEmail}? Both sides will see them as deleted.`
                  )
                }
              >
                Clear chat
              </button>
              <button
                type="button"
                className="text-[10px] tracking-[0.08em] uppercase text-red-400 hover:text-red-300"
                disabled={pending}
                onClick={() =>
                  run(
                    () => deleteConversation(userId),
                    `Permanently delete the entire conversation with ${userEmail}? This cannot be undone.`
                  )
                }
              >
                Delete chat permanently
              </button>
            </div>
          </div>
        )}

        {pinnedMessages.length > 0 && (
          <div className="border border-border/60 bg-white/3 px-3 py-2">
            <p className="text-[9px] tracking-[0.1em] uppercase text-dim mb-1">Pinned</p>
            {pinnedMessages.map((msg) => (
              <p key={msg.id} className="text-[12px] text-fg/90 truncate">
                {msg.body}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto max-h-[480px] p-6 flex flex-col gap-4">
        {visible.map((msg) => {
          const deleted = msg.deleted_at != null;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "admin" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap ${
                  deleted
                    ? "border border-dashed border-border text-dim italic"
                    : msg.sender === "admin"
                      ? "bg-accent/15 text-fg"
                      : "bg-white/6 text-fg"
                }`}
              >
                {editing === msg.id && !deleted ? (
                  <form
                    action={(formData) => {
                      run(() => editAdminMessage(msg.id, formData));
                      setEditing(null);
                    }}
                    className="flex flex-col gap-2"
                  >
                    <textarea
                      name="body"
                      defaultValue={msg.body}
                      rows={3}
                      maxLength={4000}
                      className="bg-transparent border border-border px-2 py-1 text-[13px] text-fg outline-none resize-y min-w-[240px]"
                    />
                    <div className="flex gap-3">
                      <button type="submit" className={TOOL_CLASS}>
                        Save
                      </button>
                      <button type="button" className={TOOL_CLASS} onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {deleted ? TOMBSTONE[msg.deleted_by ?? "admin"] : msg.body}
                    <div className="mt-1 text-[9px] tracking-[0.1em] uppercase text-dim">
                      {msg.sender === "admin" ? "you" : msg.user_email} ·{" "}
                      {new Date(msg.created_at).toLocaleString()}
                      {msg.edited_at ? " · edited" : ""}
                      {msg.pinned ? " · pinned" : ""}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-1">
                {!deleted && (
                  <>
                    <button
                      type="button"
                      className={TOOL_CLASS}
                      disabled={pending}
                      onClick={() => run(() => setMessagePinned(msg.id, !msg.pinned))}
                    >
                      {msg.pinned ? "Unpin" : "Pin"}
                    </button>
                    {msg.sender === "admin" && (
                      <button
                        type="button"
                        className={TOOL_CLASS}
                        onClick={() => setEditing(msg.id)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className={TOOL_CLASS}
                      disabled={pending}
                      onClick={() => run(() => deleteAdminMessage(msg.id))}
                    >
                      Delete
                    </button>
                  </>
                )}
                {deleted && (
                  <>
                    <button
                      type="button"
                      className={TOOL_CLASS}
                      disabled={pending}
                      onClick={() => run(() => restoreMessage(msg.id))}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className={TOOL_CLASS}
                      disabled={pending}
                      onClick={() =>
                        run(() => purgeMessage(msg.id), "Remove this message for good?")
                      }
                    >
                      Remove for good
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && <p className="text-[12px] text-mid">No messages yet.</p>}
      </div>

      {/* ── Composer ───────────────────────────────────────────────────── */}
      <form ref={formRef} action={replyAction} className="border-t border-border p-4 flex flex-col gap-3">
        {templates.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            <span className="text-[9px] tracking-[0.1em] uppercase text-dim self-center">
              Canned
            </span>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={TOOL_CLASS}
                onClick={() => insertTemplate(template.body)}
              >
                {template.title}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          name="body"
          required
          rows={3}
          maxLength={4000}
          placeholder="Type a reply…"
          className="bg-transparent border border-border px-3 py-2 text-[13px] text-fg outline-none transition-colors focus:border-border-hover resize-y"
        />
        {error && (
          <p className="text-[12px] text-red-400" role="alert">
            {error}
          </p>
        )}
        <SubmitButton label="Reply" pendingLabel="Sending…" />
      </form>
    </div>
  );
}
