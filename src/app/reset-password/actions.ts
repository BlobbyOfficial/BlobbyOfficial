"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type ResetPasswordState = { error: string | null };

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (!isSupabaseConfigured()) {
    return { error: "Accounts aren't configured yet." };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match." };
  }

  const supabase = await createClient();

  // The recovery link already signed this browser in (via /auth/callback), so
  // a session is what authorises the change — without one there's nothing to
  // update and the link has probably expired.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "That reset link has expired - request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message || "Couldn't update your password - try again." };
  }

  redirect("/login?reset=1");
}
