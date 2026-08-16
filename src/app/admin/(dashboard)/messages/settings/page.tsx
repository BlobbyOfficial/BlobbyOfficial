import { createClient } from "@/lib/supabase/server";
import { getMessagingSettings } from "@/lib/messaging";
import { broadcast, createTemplate, deleteTemplate, updateMessagingSettings } from "../actions";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { MessagesSubnav } from "@/components/admin/messages-subnav";

const FIELD =
  "mt-1 w-full bg-transparent border border-border px-3 py-2 text-[13px] text-fg outline-none focus:border-border-hover";
const LABEL = "text-[10px] tracking-[0.08em] uppercase text-mid block";

export default async function AdminMessagingSettingsPage() {
  const supabase = await createClient();
  const [settings, { data: templates }] = await Promise.all([
    getMessagingSettings(supabase),
    supabase.from("bo_message_templates").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.04em] mb-6">Settings &amp; tools</h1>
      <MessagesSubnav active="settings" />

      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
        {/* ── Global controls ─────────────────────────────────────────── */}
        <section className="border border-border p-6">
          <h2 className="font-display text-xl tracking-[0.04em] mb-2">Inbox controls</h2>
          <p className="text-[12px] text-mid leading-[1.7] mb-5">
            These apply to everyone. The off-switch and the length cap are enforced in the database
            too, so they hold even for a client talking to the API directly.
          </p>
          <ActionForm action={updateMessagingSettings} label="Save settings">
            <label className="text-[12px] text-fg flex items-center gap-2">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={settings.enabled}
                className="accent-current"
              />
              Accept new messages from users
            </label>
            <label className={LABEL}>
              Notice shown when messaging is off
              <input
                name="disabled_notice"
                defaultValue={settings.disabled_notice}
                maxLength={500}
                className={FIELD}
              />
            </label>
            <label className={LABEL}>
              Banner above the composer (leave blank for none)
              <input name="banner" defaultValue={settings.banner} maxLength={500} className={FIELD} />
            </label>
            <label className={LABEL}>
              Maximum message length
              <input
                type="number"
                name="max_length"
                min={100}
                max={4000}
                defaultValue={settings.max_length}
                className={FIELD}
              />
            </label>
            <label className="text-[12px] text-fg flex items-center gap-2">
              <input
                type="checkbox"
                name="auto_reply_enabled"
                defaultChecked={settings.auto_reply_enabled}
                className="accent-current"
              />
              Send an auto-reply to the first message in a quiet thread
            </label>
            <label className={LABEL}>
              Auto-reply text
              <textarea
                name="auto_reply_body"
                rows={3}
                maxLength={2000}
                defaultValue={settings.auto_reply_body}
                className={`${FIELD} resize-y`}
              />
            </label>
          </ActionForm>
        </section>

        {/* ── Broadcast ───────────────────────────────────────────────── */}
        <section className="border border-border p-6">
          <h2 className="font-display text-xl tracking-[0.04em] mb-2">Broadcast</h2>
          <p className="text-[12px] text-mid leading-[1.7] mb-5">
            Sends one message into every conversation as a normal reply. Blocked accounts are
            skipped.
          </p>
          <ActionForm action={broadcast} label="Send broadcast" pendingLabel="Sending…" reset>
            <textarea
              name="body"
              rows={5}
              required
              maxLength={4000}
              placeholder="e.g. Away until the 20th - replies will be slow."
              className={`${FIELD} resize-y`}
            />
            <label className="text-[12px] text-fg flex items-center gap-2">
              <input
                type="checkbox"
                name="skip_archived"
                defaultChecked
                className="accent-current"
              />
              Skip archived conversations
            </label>
          </ActionForm>
        </section>

        {/* ── Canned replies ──────────────────────────────────────────── */}
        <section className="border border-border p-6 col-span-2 max-md:col-span-1">
          <h2 className="font-display text-xl tracking-[0.04em] mb-2">Canned replies</h2>
          <p className="text-[12px] text-mid leading-[1.7] mb-5">
            Available as one-click inserts above the reply box in every thread.
          </p>

          <div className="grid grid-cols-[380px_1fr] gap-8 max-md:grid-cols-1">
            <ActionForm action={createTemplate} label="Add template" reset>
              <label className={LABEL}>
                Title
                <input name="title" required maxLength={80} className={FIELD} />
              </label>
              <label className={LABEL}>
                Body
                <textarea
                  name="body"
                  required
                  rows={4}
                  maxLength={4000}
                  className={`${FIELD} resize-y`}
                />
              </label>
              <label className={LABEL}>
                Sort order
                <input type="number" name="sort_order" defaultValue={0} className={FIELD} />
              </label>
            </ActionForm>

            <div className="border border-border">
              {(templates ?? []).map((template) => (
                <div key={template.id} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[13px] text-fg">{template.title}</p>
                    <ActionButton
                      action={deleteTemplate.bind(null, template.id)}
                      label="Delete"
                      confirm={`Delete the "${template.title}" template?`}
                      className="text-[10px] tracking-[0.08em] uppercase text-red-400"
                    />
                  </div>
                  <p className="text-[12px] text-mid mt-2 whitespace-pre-wrap leading-[1.6]">
                    {template.body}
                  </p>
                </div>
              ))}
              {(!templates || templates.length === 0) && (
                <p className="text-[12px] text-mid p-5">No templates yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
