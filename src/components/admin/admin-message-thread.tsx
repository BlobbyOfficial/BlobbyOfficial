"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { sendAdminReply, markConversationRead } from "@/app/admin/(dashboard)/messages/actions";
import type { BoMessage } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary self-start" disabled={pending}>
      {pending ? "Sending…" : "Reply"}
    </button>
  );
}

export function AdminMessageThread({
  userId,
  initialMessages,
}: {
  userId: string;
  initialMessages: BoMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    markConversationRead(userId);
  }, [userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin:bo_messages:${userId}`)
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

  const replyAction = async (formData: FormData) => {
    await sendAdminReply(userId, formData);
    formRef.current?.reset();
  };

  return (
    <div className="border border-border flex flex-col">
      <div className="flex-1 overflow-y-auto max-h-[480px] p-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-[1.6] whitespace-pre-wrap ${
                msg.sender === "admin" ? "bg-accent/15 text-fg" : "bg-white/6 text-fg"
              }`}
            >
              {msg.body}
              <div className="mt-1 text-[9px] tracking-[0.1em] uppercase text-dim">
                {msg.sender === "admin" ? "you" : msg.user_email} ·{" "}
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-[12px] text-mid">No messages yet.</p>}
      </div>

      <form ref={formRef} action={replyAction} className="border-t border-border p-4 flex flex-col gap-3">
        <textarea
          name="body"
          required
          rows={3}
          maxLength={4000}
          placeholder="Type a reply…"
          className="bg-transparent border border-border px-3 py-2 text-[13px] text-fg outline-none transition-colors focus:border-border-hover resize-y"
        />
        <SubmitButton />
      </form>
    </div>
  );
}
