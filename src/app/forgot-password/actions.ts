"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { isRateLimited } from "@/lib/rate-limit";

export type ForgotPasswordState = { error: string | null; info: string | null };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  if (!isSupabaseConfigured()) {
    return { error: "Accounts aren't configured yet.", info: null };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter the email you signed up with.", info: null };
  }

  if (isRateLimited(`password-reset:${email.toLowerCase()}`)) {
    return { error: "Too many attempts - wait a minute and try again.", info: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getAuthCallbackUrl("/reset-password"),
  });

  if (error) {
    return { error: error.message || "Couldn't send that email - try again.", info: null };
  }

  // Deliberately the same message whether or not the address has an account,
  // so this can't be used to find out who's registered.
  return {
    error: null,
    info: "If that email has an account, a reset link is on its way. The link expires in an hour.",
  };
}
