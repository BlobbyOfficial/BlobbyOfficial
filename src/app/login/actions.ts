"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthState = { error: string | null; needsVerification?: boolean };

function safeNext(next: FormDataEntryValue | null): string {
  const value = String(next ?? "");
  return value.startsWith("/") && !value.startsWith("//") ? value : "/contact";
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Accounts aren't configured yet." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // An unconfirmed account is a different problem from a wrong password, and
    // it's fixable from this page — say so and offer the resend button.
    if (error.code === "email_not_confirmed") {
      return {
        error: "Verify your email address first - we sent you a link when you signed up.",
        needsVerification: true,
      };
    }
    return { error: "Invalid email or password." };
  }

  redirect(next);
}
