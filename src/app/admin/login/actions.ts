"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return { error: "Admin isn't configured yet - see DEPLOY.md." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  // Site accounts and the admin share one Supabase auth, so valid credentials
  // aren't enough. Without this check a normal account signs in successfully,
  // gets redirected to /admin, is bounced straight back by the dashboard
  // layout, and lands on this form again with nothing explaining why.
  const { data: adminRow } = await supabase
    .from("bo_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    // Don't leave them silently holding a session they didn't ask for.
    await supabase.auth.signOut();
    return { error: "That account doesn't have admin access." };
  }

  redirect("/admin");
}
