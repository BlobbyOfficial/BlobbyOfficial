"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  clearOwnMessages,
  deleteOwnMessage,
  sendMessage,
  type SendMessageState,
} from "@/app/contact/actions";
import { TOMBSTONE } from "@/lib/messaging";
import type { BoMessage } from "@/lib/types";

const initialState: SendMessageState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function MessageThread({
  userId,
  initialMessages,
  maxLength = 4000,
  banner = "",
  disabledNotice = null,
  blocked = false,
}: {
  userId: string;
  initialMessages: BoMessage[];
  maxLength?: number;
  banner?: string;
  /** Set when the admin has paused messaging - the composer is hidden. */
  disabledNotice?: string | null;
  blocked?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction] = useActionState(sendMessage, initialState);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Re-sync when the server sends a fresh copy (after any action revalidates
  // the page). React's documented "adjust state when a prop changes" pattern —
  // doing it in an effect would render the stale list first.
  const [lastServerCopy, setLastServerCopy] = useState(initialMessages);
  if (initialMessages !== lastServerCopy) {
    setLastServerCopy(initialMessages);
    setMessages(initialMessages);
  }

  // "*" rather than INSERT: a message either side deletes has to disappear
  // from an open tab too, not just on the next page load.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bo_messages:${userId}`)
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

  useEffect(() => {
    if (state.error === null) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const run = (action: () => Promise<SendMessageState>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setActionError(null);
    startTransition(async () => {
      const result = await action();
      setActionError(result.error);
    });
  };

  const ordered = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const hasOwnMessages = ordered.some((m) => m.sender === "user" && !m.deleted_at);

  return (
    <div className="border border-border flex flex-col max-w-lg">
      {banner && (
        <p className="border-b border-border px-4 py-2.5 text-[12px] text-mid leading-[1.6]">
          {banner}
        </p>
      )}

      <div className="flex-1 overflow-y-auto max-h-[420px] p-6 flex flex-col gap-4">
        {ordered.length === 0 && (
          <p className="text-[13px] text-mid">
            No messages yet - say hello and I&apos;ll get back to you within a day.
          </p>
        )}
        {ordered.map((msg) => {
          const deleted = msg.deleted_at != null;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "admin" ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap ${
                  deleted
                    ? "border border-dashed border-border text-dim italic"
                    : msg.sender === "admin"
                      ? "bg-white/6 text-fg"
                      : "bg-accent/15 text-fg"
                }`}
              >
                {deleted ? TOMBSTONE[msg.deleted_by ?? "admin"] : msg.body}
                <div className="mt-1 text-[9px] tracking-[0.1em] uppercase text-dim">
                  {msg.sender === "admin" ? "blobbyofficial" : "you"} ·{" "}
                  {new Date(msg.created_at).toLocaleString()}
                  {msg.edited_at ? " · edited" : ""}
                </div>
              </div>
              {msg.sender === "user" && !deleted && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteOwnMessage(msg.id))}
                  className="mt-1 text-[10px] tracking-[0.08em] uppercase text-mid hover:text-fg disabled:opacity-40"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {hasOwnMessages && (
        <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                clearOwnMessages,
                "Delete all of your own messages in this chat? My replies will stay."
              )
            }
            className="text-[10px] tracking-[0.08em] uppercase text-mid hover:text-fg disabled:opacity-40"
          >
            Delete my messages
          </button>
          {actionError && <span className="text-[11px] text-red-400">{actionError}</span>}
        </div>
      )}

      {blocked ? (
        <p className="border-t border-border p-4 text-[12px] text-mid leading-[1.7]">
          You can no longer send messages here. If you think that&apos;s a mistake, reach out on
          Discord.
        </p>
      ) : disabledNotice ? (
        <p className="border-t border-border p-4 text-[12px] text-mid leading-[1.7]">
          {disabledNotice}
        </p>
      ) : (
        <form
          ref={formRef}
          action={formAction}
          className="border-t border-border p-4 flex flex-col gap-3"
        >
          <textarea
            name="body"
            required
            rows={3}
            maxLength={maxLength}
            placeholder="Type your message…"
            className="bg-transparent border border-border px-3 py-2 text-[13px] text-fg outline-none transition-colors focus:border-border-hover resize-y"
          />
          {state.error && (
            <p className="text-[12px] text-red-400" role="alert">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
