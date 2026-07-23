"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, type SendMessageState } from "@/app/contact/actions";
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
}: {
  userId: string;
  initialMessages: BoMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, formAction] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bo_messages:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bo_messages", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as BoMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
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

  return (
    <div className="border border-border flex flex-col max-w-lg">
      <div className="flex-1 overflow-y-auto max-h-[420px] p-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-[13px] text-mid">
            No messages yet — say hello and I&apos;ll get back to you within a day.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap ${
                msg.sender === "admin" ? "bg-white/6 text-fg" : "bg-accent/15 text-fg"
              }`}
            >
              {msg.body}
              <div className="mt-1 text-[9px] tracking-[0.1em] uppercase text-dim">
                {msg.sender === "admin" ? "blobbyofficial" : "you"} ·{" "}
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={formAction} className="border-t border-border p-4 flex flex-col gap-3">
        <textarea
          name="body"
          required
          rows={3}
          maxLength={4000}
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
    </div>
  );
}
