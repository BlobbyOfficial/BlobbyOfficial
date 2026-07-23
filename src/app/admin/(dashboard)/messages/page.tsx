import { createClient } from "@/lib/supabase/server";
import type { BoMessage } from "@/lib/types";
import { markRead, deleteMessage } from "./actions";
import { AdminMessageThread } from "@/components/admin/admin-message-thread";

type Conversation = {
  userId: string;
  userEmail: string;
  lastAt: string;
  unreadCount: number;
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: selectedUserId } = await searchParams;
  const supabase = await createClient();

  const [{ data: allMessages }, { data: legacyMessages }] = await Promise.all([
    supabase.from("bo_messages").select("*").order("created_at", { ascending: true }),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
  ]);

  const messages = allMessages ?? [];

  const conversations = new Map<string, Conversation>();
  for (const msg of messages) {
    const existing = conversations.get(msg.user_id);
    conversations.set(msg.user_id, {
      userId: msg.user_id,
      userEmail: msg.user_email,
      lastAt: msg.created_at,
      unreadCount:
        (existing?.unreadCount ?? 0) + (msg.sender === "user" && !msg.read ? 1 : 0),
    });
  }
  const conversationList = Array.from(conversations.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  const activeUserId = selectedUserId ?? conversationList[0]?.userId ?? null;
  const activeMessages: BoMessage[] = activeUserId
    ? messages.filter((m) => m.user_id === activeUserId)
    : [];

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-8">Messages</h1>

      <div className="grid grid-cols-[260px_1fr] gap-6 mb-16 max-md:grid-cols-1">
        <div className="border border-border flex flex-col">
          {conversationList.map((conv) => (
            <a
              key={conv.userId}
              href={`/admin/messages?user=${conv.userId}`}
              className={`px-4 py-3 border-b border-border text-[12px] no-underline transition-colors hover:bg-white/5 ${
                conv.userId === activeUserId ? "bg-white/8 text-fg" : "text-mid"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{conv.userEmail}</span>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 text-[9px] bg-accent/20 text-fg px-1.5 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-dim mt-1">
                {new Date(conv.lastAt).toLocaleString()}
              </div>
            </a>
          ))}
          {conversationList.length === 0 && (
            <p className="text-[12px] text-mid p-4">No conversations yet.</p>
          )}
        </div>

        {activeUserId ? (
          <AdminMessageThread key={activeUserId} userId={activeUserId} initialMessages={activeMessages} />
        ) : (
          <div className="border border-border p-6 text-[12px] text-mid">
            Select a conversation to view it.
          </div>
        )}
      </div>

      <h2 className="font-display text-xl tracking-[0.04em] mb-4">
        Legacy contact form submissions
      </h2>
      <div className="flex flex-col gap-3">
        {(legacyMessages ?? []).map((msg) => (
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
        {(!legacyMessages || legacyMessages.length === 0) && (
          <p className="text-[12px] text-mid">None.</p>
        )}
      </div>
    </div>
  );
}
