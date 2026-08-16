import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BoBlock, BoConversation, BoMessage } from "@/lib/types";
import { markAllRead, markRead, deleteMessage, purgeDeleted } from "./actions";
import { AdminMessageThread } from "@/components/admin/admin-message-thread";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { MessagesSubnav } from "@/components/admin/messages-subnav";

type Filter = "all" | "unread" | "starred" | "pinned" | "archived" | "blocked";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "starred", label: "Starred" },
  { key: "pinned", label: "Pinned" },
  { key: "archived", label: "Archived" },
  { key: "blocked", label: "Blocked" },
];

type Conversation = {
  userId: string;
  userEmail: string;
  lastAt: string;
  preview: string;
  total: number;
  unreadCount: number;
  meta: BoConversation | null;
  blocked: boolean;
};

function isBlocked(blocks: BoBlock[], userId: string, email: string): boolean {
  return blocks.some(
    (block) =>
      block.user_id === userId ||
      (block.email != null && block.email.toLowerCase() === email.toLowerCase())
  );
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; q?: string; filter?: string }>;
}) {
  const { user: selectedUserId, q = "", filter: filterParam } = await searchParams;
  const filter: Filter =
    FILTERS.find((f) => f.key === filterParam)?.key ?? ("all" as Filter);
  const query = q.trim().toLowerCase();

  const supabase = await createClient();

  const [
    { data: allMessages },
    { data: conversationMeta },
    { data: blocks },
    { data: templates },
    { data: legacyMessages },
  ] = await Promise.all([
    supabase.from("bo_messages").select("*").order("created_at", { ascending: true }),
    supabase.from("bo_conversations").select("*"),
    supabase.from("bo_blocks").select("*"),
    supabase.from("bo_message_templates").select("*").order("sort_order", { ascending: true }),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
  ]);

  const messages = allMessages ?? [];
  const metaByUser = new Map((conversationMeta ?? []).map((m) => [m.user_id, m]));
  const blockList = blocks ?? [];

  // ── Roll the flat message list up into per-user conversations ──────────
  const conversations = new Map<string, Conversation>();
  for (const msg of messages) {
    const existing = conversations.get(msg.user_id);
    const meta = metaByUser.get(msg.user_id) ?? null;
    conversations.set(msg.user_id, {
      userId: msg.user_id,
      userEmail: msg.user_email,
      lastAt: msg.created_at,
      preview: msg.deleted_at ? "(deleted)" : msg.body.slice(0, 60),
      total: (existing?.total ?? 0) + 1,
      unreadCount:
        (existing?.unreadCount ?? 0) +
        (msg.sender === "user" && !msg.read && !msg.deleted_at ? 1 : 0),
      meta,
      blocked: isBlocked(blockList, msg.user_id, msg.user_email),
    });
  }

  let conversationList = Array.from(conversations.values());

  if (query) {
    conversationList = conversationList.filter(
      (conv) =>
        conv.userEmail.toLowerCase().includes(query) ||
        (conv.meta?.label ?? "").toLowerCase().includes(query) ||
        messages.some(
          (m) =>
            m.user_id === conv.userId && !m.deleted_at && m.body.toLowerCase().includes(query)
        )
    );
  }

  conversationList = conversationList.filter((conv) => {
    switch (filter) {
      case "unread":
        return conv.unreadCount > 0;
      case "starred":
        return Boolean(conv.meta?.starred);
      case "pinned":
        return Boolean(conv.meta?.pinned);
      case "archived":
        return Boolean(conv.meta?.archived);
      case "blocked":
        return conv.blocked;
      default:
        // Archived threads stay out of the default view — that's the point of
        // archiving — but every other filter shows exactly what it names.
        return !conv.meta?.archived;
    }
  });

  conversationList.sort((a, b) => {
    if (Boolean(a.meta?.pinned) !== Boolean(b.meta?.pinned)) return a.meta?.pinned ? -1 : 1;
    return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
  });

  const activeUserId =
    (selectedUserId && conversations.has(selectedUserId) ? selectedUserId : null) ??
    conversationList[0]?.userId ??
    null;
  const activeConversation = activeUserId ? conversations.get(activeUserId)! : null;
  const activeMessages: BoMessage[] = activeUserId
    ? messages.filter((m) => m.user_id === activeUserId)
    : [];

  const totalUnread = Array.from(conversations.values()).reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );
  const deletedCount = messages.filter((m) => m.deleted_at).length;

  const buildHref = (patch: { user?: string; filter?: Filter }) => {
    const params = new URLSearchParams();
    if (patch.user) params.set("user", patch.user);
    if (q) params.set("q", q);
    const nextFilter = patch.filter ?? filter;
    if (nextFilter !== "all") params.set("filter", nextFilter);
    const search = params.toString();
    return search ? `/admin/messages?${search}` : "/admin/messages";
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
        <h1 className="font-display text-3xl tracking-[0.04em]">Messages</h1>
        <p className="text-[11px] text-dim tracking-[0.08em] uppercase">
          {conversations.size} conversation{conversations.size === 1 ? "" : "s"} · {totalUnread}{" "}
          unread · {deletedCount} deleted
        </p>
      </div>

      <MessagesSubnav active="inbox" />

      {/* ── Search, filters and bulk actions ───────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <form method="get" className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search email, label or message…"
            className="bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover w-[260px] max-md:w-full"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <button type="submit" className="text-[10px] tracking-[0.08em] uppercase text-mid hover:text-fg">
            Search
          </button>
          {query && (
            <Link
              href={buildHref({})}
              className="text-[10px] tracking-[0.08em] uppercase text-mid hover:text-fg no-underline"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="flex items-center gap-4 flex-wrap">
          {FILTERS.map((option) => (
            <Link
              key={option.key}
              href={buildHref({ filter: option.key })}
              className={`text-[10px] tracking-[0.08em] uppercase no-underline transition-colors ${
                option.key === filter ? "text-fg" : "text-mid hover:text-fg"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 flex-wrap mb-5">
        <ActionButton action={markAllRead} label="Mark everything read" pendingLabel="Marking…" />
        <ActionForm
          action={purgeDeleted}
          label="Purge deleted"
          pendingLabel="Purging…"
          className="flex items-center gap-3 flex-wrap"
        >
          <label className="text-[10px] tracking-[0.08em] uppercase text-mid flex items-center gap-2">
            Older than
            <input
              type="number"
              name="days"
              min={0}
              defaultValue={30}
              className="bg-transparent border border-border px-2 py-1 text-[12px] text-fg outline-none w-[70px]"
            />
            days
          </label>
        </ActionForm>
      </div>

      {/* ── Inbox ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[300px_1fr] gap-6 mb-16 max-md:grid-cols-1">
        <div className="border border-border flex flex-col max-h-[720px] overflow-y-auto">
          {conversationList.map((conv) => (
            <Link
              key={conv.userId}
              href={buildHref({ user: conv.userId })}
              className={`px-4 py-3 border-b border-border text-[12px] no-underline transition-colors hover:bg-white/5 ${
                conv.userId === activeUserId ? "bg-white/8 text-fg" : "text-mid"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {conv.meta?.pinned && <span className="text-accent">▲ </span>}
                  {conv.meta?.starred && <span className="text-accent">★ </span>}
                  {conv.userEmail}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="shrink-0 text-[9px] bg-accent/20 text-fg px-1.5 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-dim mt-1 truncate">{conv.preview}</div>
              <div className="text-[10px] text-dim mt-1 flex gap-2 flex-wrap">
                <span>{new Date(conv.lastAt).toLocaleString()}</span>
                {conv.meta?.label && <span className="text-mid">· {conv.meta.label}</span>}
                {conv.meta?.archived && <span>· archived</span>}
                {conv.blocked && <span className="text-red-400">· blocked</span>}
              </div>
            </Link>
          ))}
          {conversationList.length === 0 && (
            <p className="text-[12px] text-mid p-4">
              {query || filter !== "all" ? "Nothing matches that view." : "No conversations yet."}
            </p>
          )}
        </div>

        {activeUserId && activeConversation ? (
          <AdminMessageThread
            key={activeUserId}
            userId={activeUserId}
            userEmail={activeConversation.userEmail}
            initialMessages={activeMessages}
            conversation={activeConversation.meta}
            templates={templates ?? []}
            blocked={activeConversation.blocked}
          />
        ) : (
          <div className="border border-border p-6 text-[12px] text-mid">
            Select a conversation to view it.
          </div>
        )}
      </div>

      {/* ── Legacy contact form submissions ────────────────────────────── */}
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
                <a
                  href={`mailto:${msg.email}`}
                  className="text-[12px] text-mid underline underline-offset-2"
                >
                  {msg.email}
                </a>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-dim tracking-[0.08em] uppercase shrink-0">
                <span>{new Date(msg.created_at).toLocaleString()}</span>
                <ActionButton
                  action={markRead.bind(null, msg.id, !msg.read)}
                  label={`Mark ${msg.read ? "unread" : "read"}`}
                />
                <ActionButton
                  action={deleteMessage.bind(null, msg.id)}
                  label="Delete"
                  confirm={`Delete the submission from ${msg.email}?`}
                  className="text-[10px] tracking-[0.08em] uppercase text-red-400"
                />
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
