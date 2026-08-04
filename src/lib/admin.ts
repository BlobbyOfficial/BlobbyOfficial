import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Asserts that the caller is a signed-in member of bo_admins, returning the
 * Supabase client to use for the rest of the action.
 *
 * The `bo_admins` check in `app/admin/(dashboard)/layout.tsx` only guards page
 * *rendering*. Server Actions are individually addressable POST endpoints —
 * the layout never runs for them — so anything that mutates admin-owned data
 * has to re-check on its own. Row-level security is the backstop (see
 * migration 0009), but a mutation that silently no-ops under RLS is a bad
 * failure mode: better to refuse loudly here.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase isn't configured — see DEPLOY.md.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in.");
  }

  const { data: adminRow } = await supabase
    .from("bo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    throw new Error("Not authorised.");
  }

  return { supabase, user };
}

/**
 * True when the signed-in user is an admin. Used where a page needs to branch
 * on admin-ness rather than refuse outright.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
