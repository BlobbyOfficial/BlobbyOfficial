"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { isRateLimited } from "@/lib/rate-limit";

export type AuthState = { error: string | null; info?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const value = String(next ?? "");
  return value.startsWith("/") && !value.startsWith("//") ? value : "/contact";
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Accounts aren't configured yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter an email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Confirmation link lands on /auth/callback, which turns the code into a
    // session and drops the user where they were headed — signed in, verified.
    options: { emailRedirectTo: await getAuthCallbackUrl(next) },
  });

  if (error) {
    return { error: error.message || "Couldn't create that account - try again." };
  }

  if (!data.session) {
    return {
      error: null,
      info: "Check your email to verify your account - the link signs you straight in.",
    };
  }

  redirect(next);
}

/**
 * Re-sends the verification email for an address that signed up but never
 * confirmed. Shown on the sign-in page, where "email not confirmed" is the
 * error people actually hit.
 */
export async function resendVerification(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Accounts aren't configured yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const next = safeNext(formData.get("next"));

  if (!email) {
    return { error: "Enter your email above first, then resend." };
  }
  if (isRateLimited(`verify-resend:${email.toLowerCase()}`)) {
    return { error: "Too many attempts - wait a minute and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await getAuthCallbackUrl(next) },
  });

  if (error) {
    return { error: error.message || "Couldn't resend that email - try again." };
  }

  return { error: null, info: "Verification email sent - check your inbox." };
}
