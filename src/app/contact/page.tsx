import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { MessageThread } from "@/components/message-thread";
import { AccountSignOutButton } from "@/components/account-sign-out-button";
import { Reveal } from "@/components/reveal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SOCIALS } from "@/lib/site";
import type { BoMessage } from "@/lib/types";
import { DEFAULT_MESSAGING_SETTINGS, getMessagingSettings } from "@/lib/messaging";

export const metadata: Metadata = {
  title: "Contact",
  description: "Message blobbyofficial about freelance editing work or preset support.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  let messages: BoMessage[] = [];
  let settings = DEFAULT_MESSAGING_SETTINGS;
  let blocked = false;
  if (supabase && user) {
    const [{ data }, loadedSettings, { data: blockedFlag }] = await Promise.all([
      supabase
        .from("bo_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      getMessagingSettings(supabase),
      supabase.rpc("bo_am_i_blocked"),
    ]);
    messages = data ?? [];
    settings = loadedSettings;
    blocked = Boolean(blockedFlag);
  }

  return (
    <>
      <PageHero
        tag="Contact"
        title="Let's talk"
        subtitle="about your edit"
        ghost="@"
        description="Sign in to message me directly. Tell me about your footage, deadline, and what you're going for - I reply within a day."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <div className="grid grid-cols-[1fr_1fr] gap-20 max-md:grid-cols-1 max-md:gap-12">
          <Reveal>
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-dim tracking-[0.1em] uppercase">
                    Signed in as {user.email}
                  </p>
                  <AccountSignOutButton />
                </div>
                <MessageThread
                  userId={user.id}
                  initialMessages={messages}
                  maxLength={settings.max_length}
                  banner={settings.banner}
                  disabledNotice={settings.enabled ? null : settings.disabled_notice}
                  blocked={blocked}
                />
              </div>
            ) : !isSupabaseConfigured() ? (
              <div className="border border-border p-9 max-md:p-6">
                <p className="text-[13px] text-mid leading-[1.7]">
                  Messaging isn&apos;t configured on this deployment yet.
                </p>
              </div>
            ) : (
              <div className="border border-border p-9 max-md:p-6 flex flex-col gap-5">
                <p className="font-display text-2xl tracking-[0.06em]">Account required</p>
                <p className="text-[13px] text-mid leading-[1.7]">
                  Sending a message needs a free account so we can keep the conversation in one
                  place - no more digging through old emails or DMs.
                </p>
                <div className="flex gap-4">
                  <Link href="/signup?next=/contact" className="btn-primary">
                    Sign up
                  </Link>
                  <Link href="/login?next=/contact" className="btn-ghost">
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </Reveal>

          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.06em] mb-4">Prefer to chat directly?</h2>
            <p className="text-[13px] text-mid leading-[1.8] mb-6 max-w-sm">
              For quick questions or if you&apos;d rather talk it through first, reach out on Discord.
              For preset support requests, the FAQ covers the most common issues.
            </p>
            <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              Message on Discord →
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
