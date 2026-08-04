import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ScriptEditor } from "@/components/script-editor";

// A private document behind a share link — never index it, and don't leak the
// title into a listing either.
export const metadata: Metadata = {
  title: "Script",
  robots: { index: false, follow: false },
};

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  if (!user) redirect(`/login?next=/scripts/${id}`);

  // Fetched by uuid through a security-definer function rather than a table
  // query: bo_scripts is owner-only at the RLS level, and knowing the id is
  // exactly what "having the share link" means (see migration 0009).
  const { data } = await supabase.rpc("bo_script_get", { p_id: id });
  const script = data?.[0];

  if (!script) notFound();

  return (
    <div className="min-h-screen pt-28 px-10 pb-16 max-md:px-5 max-md:pt-24">
      <ScriptEditor
        scriptId={script.id}
        initialTitle={script.title}
        initialContentBase64={script.content}
        isOwner={script.owner_id === user.id}
        currentUserEmail={user.email ?? "anonymous"}
      />
    </div>
  );
}
