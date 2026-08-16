import { createClient } from "@/lib/supabase/server";
import { blockUser, unblock } from "../actions";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { MessagesSubnav } from "@/components/admin/messages-subnav";

export default async function AdminBlocksPage() {
  const supabase = await createClient();

  const [{ data: blocks }, { data: messages }] = await Promise.all([
    supabase.from("bo_blocks").select("*").order("created_at", { ascending: false }),
    supabase.from("bo_messages").select("user_id, user_email"),
  ]);

  // Everyone who has ever written in, so a block can be applied by picking a
  // known sender instead of pasting a uuid by hand.
  const senders = new Map<string, string>();
  for (const msg of messages ?? []) senders.set(msg.user_id, msg.user_email);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-6">Blocked</h1>
      <MessagesSubnav active="blocks" />

      <p className="text-[13px] text-mid leading-[1.7] max-w-xl mb-8">
        A block stops new messages from an account or an email address. Blocking the address as
        well as the account matters: an account can be deleted and re-created, an address can&apos;t.
        You can still reply in a blocked thread - useful for explaining the block itself.
      </p>

      <div className="grid grid-cols-[380px_1fr] gap-8 max-md:grid-cols-1">
        <div className="border border-border p-6">
          <h2 className="font-display text-xl tracking-[0.04em] mb-4">Add a block</h2>
          <ActionForm action={blockUser} label="Block" pendingLabel="Blocking…" reset>
            <label className="text-[10px] tracking-[0.08em] uppercase text-mid">
              Known sender
              <select
                name="user_id"
                defaultValue=""
                className="mt-1 w-full bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover"
              >
                <option value="">— none —</option>
                {Array.from(senders.entries()).map(([id, email]) => (
                  <option key={id} value={id} className="bg-bg">
                    {email}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] tracking-[0.08em] uppercase text-mid">
              Email address
              <input
                name="email"
                type="email"
                placeholder="someone@example.com"
                className="mt-1 w-full bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover"
              />
            </label>
            <label className="text-[10px] tracking-[0.08em] uppercase text-mid">
              Reason
              <input
                name="reason"
                maxLength={500}
                placeholder="Optional - for your own records"
                className="mt-1 w-full bg-transparent border border-border px-3 py-2 text-[12px] text-fg outline-none focus:border-border-hover"
              />
            </label>
          </ActionForm>
        </div>

        <div className="border border-border">
          {(blocks ?? []).map((block) => (
            <div
              key={block.id}
              className="px-5 py-4 border-b border-border flex items-start justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0">
                <p className="text-[13px] text-fg truncate">
                  {block.email ?? senders.get(block.user_id ?? "") ?? "Account"}
                </p>
                <p className="text-[10px] text-dim tracking-[0.08em] uppercase mt-1">
                  {block.user_id ? "account" : "email only"} ·{" "}
                  {new Date(block.created_at).toLocaleString()}
                </p>
                {block.reason && (
                  <p className="text-[12px] text-mid mt-2 whitespace-pre-wrap">{block.reason}</p>
                )}
              </div>
              <ActionButton
                action={unblock.bind(null, block.id)}
                label="Unblock"
                pendingLabel="Removing…"
              />
            </div>
          ))}
          {(!blocks || blocks.length === 0) && (
            <p className="text-[12px] text-mid p-5">Nobody is blocked.</p>
          )}
        </div>
      </div>
    </div>
  );
}
