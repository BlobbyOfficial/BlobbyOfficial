import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site";

/**
 * Absolute origin for the current request, so the links Supabase emails
 * (confirm email, password reset) come back to the deployment the user
 * actually signed up on — including Vercel preview URLs — rather than always
 * to the production domain.
 */
export async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return SITE_URL;

  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Where Supabase should send the user after they click a link in an auth
 * email. `/auth/callback` turns the one-time code into a session and then
 * forwards them to `next`.
 */
export async function getAuthCallbackUrl(next: string): Promise<string> {
  const origin = await getOrigin();
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}
