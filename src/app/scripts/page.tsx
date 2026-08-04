import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createScript, deleteScript } from "./actions";

// Sign-in gated: signed-out visitors are redirected to /login, so there is
// nothing here for a crawler to index.
export const metadata: Metadata = {
  title: "Scripts",
  description: "Real-time collaborative script writing.",
  robots: { index: false, follow: false },
};

export default async function ScriptsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16 text-center">
        <p className="text-[13px] text-mid">Scripts aren&apos;t configured on this deployment yet.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/scripts");

  const { data: scripts } = await supabase
    .from("bo_scripts")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <>
      <PageHero
        tag="Scripts"
        title="Write"
        subtitle="together"
        ghost="//"
        description="Real-time collaborative script writing - like a shared doc. Create one, then send the link to anyone with an account to edit it live together."
      />

      <section className="border-t border-border py-20 px-10 max-md:py-14 max-md:px-6">
        <form
          action={createScript}
          className="border border-border p-6 mb-10 flex gap-4 items-end max-md:flex-col max-md:items-stretch"
        >
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="title" className="text-[9px] tracking-[0.14em] uppercase text-mid">
              Title
            </label>
            <input
              id="title"
              name="title"
              placeholder="Untitled script"
              className="bg-transparent border border-border px-3 py-2 text-[13px] text-fg outline-none transition-colors focus:border-border-hover w-full"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            New script
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {(scripts ?? []).map((script) => (
            <div
              key={script.id}
              className="border border-border p-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start"
            >
              <div>
                <Link
                  href={`/scripts/${script.id}`}
                  className="font-display text-xl tracking-[0.04em] no-underline hover:underline"
                >
                  {script.title}
                </Link>
                <p className="text-[11px] text-dim mt-1">
                  Updated {new Date(script.updated_at).toLocaleString()}
                </p>
              </div>
              <form action={deleteScript.bind(null, script.id)}>
                <button type="submit" className="text-[11px] text-red-400 uppercase tracking-[0.1em]">
                  Delete
                </button>
              </form>
            </div>
          ))}
          {(!scripts || scripts.length === 0) && (
            <p className="text-[12px] text-mid">No scripts yet - create one above.</p>
          )}
        </div>
      </section>
    </>
  );
}
