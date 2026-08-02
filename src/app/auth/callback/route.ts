import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/contact";
}

/**
 * Landing point for every link Supabase sends by email — signup confirmation,
 * magic links, and password recovery. It swaps the one-time code/token for a
 * real session (cookies are written by the Supabase server client) and then
 * forwards the user on to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const redirectTo = new URL(next, request.nextUrl.origin);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=auth-unavailable", request.nextUrl.origin));
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(redirectTo);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(new URL("/login?error=link-expired", request.nextUrl.origin));
}
