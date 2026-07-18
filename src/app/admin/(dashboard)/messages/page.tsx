import { createClient } from "@/lib/supabase/server";
import { markRead, deleteMessage } from "./actions";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Messages</h1>

      <div className="flex flex-col gap-3">
        {(messages ?? []).map((msg) => (
          <div
            key={msg.id}
            className={`border p-6 ${msg.read ? "border-border" : "border-accent/40 bg-accent/3"}`}
          >
            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
              <div>
                <p className="font-display text-xl tracking-[0.04em]">{msg.name}</p>
                <a href={`mailto:${msg.email}`} className="text-[12px] text-mid underline underline-offset-2">
                  {msg.email}
                </a>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-dim tracking-[0.08em] uppercase shrink-0">
                <span>{new Date(msg.created_at).toLocaleString()}</span>
                <form action={markRead.bind(null, msg.id, !msg.read)}>
                  <button type="submit" className="text-mid hover:text-fg transition-colors">
                    Mark {msg.read ? "unread" : "read"}
                  </button>
                </form>
                <form action={deleteMessage.bind(null, msg.id)}>
                  <button type="submit" className="text-red-400">
                    Delete
                  </button>
                </form>
              </div>
            </div>
            <p className="text-[13px] text-fg/90 leading-[1.7] whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="text-[12px] text-mid">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
